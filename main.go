package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/bregydoc/gtranslate"
)

const (
	contentTypeJSON = "application/json"
)

// TranslateRequest 翻译请求结构
type TranslateRequest struct {
	Text  string   `json:"text"`
	Texts []string `json:"texts,omitempty"` // 批量翻译
	From  string   `json:"from"`
	To    string   `json:"to"`
}

// TranslateResponse 翻译响应结构
type TranslateResponse struct {
	Success    bool     `json:"success"`
	Original   string   `json:"original,omitempty"`
	Translated string   `json:"translated,omitempty"`
	Results    []Result `json:"results,omitempty"` // 批量翻译结果
	From       string   `json:"from"`
	To         string   `json:"to"`
	Error      string   `json:"error,omitempty"`
}

// Result 单个翻译结果
type Result struct {
	Original   string `json:"original"`
	Translated string `json:"translated"`
}

func main() {
	// 命令行参数
	text := flag.String("text", "", "Text to translate")
	from := flag.String("from", "auto", "Source language (default: auto)")
	to := flag.String("to", "en", "Target language (default: en)")
	jsonMode := flag.Bool("json", false, "Use JSON input/output mode")
	batch := flag.Bool("batch", false, "Batch translate mode (comma-separated texts)")
	server := flag.Bool("server", false, "Run as HTTP server")
	port := flag.String("port", "8080", "HTTP server port (default: 8080)")
	help := flag.Bool("help", false, "Show help message")

	flag.Parse()

	// 显示帮助信息
	if *help {
		showHelp()
		return
	}

	// HTTP服务器模式
	if *server {
		startHTTPServer(*port)
		return
	}

	// JSON模式：从stdin读取JSON输入
	if *jsonMode {
		handleJSONMode()
		return
	}

	// 批量翻译模式
	if *batch && *text != "" {
		texts := strings.Split(*text, ",")
		for i := range texts {
			texts[i] = strings.TrimSpace(texts[i])
		}
		handleBatchTranslate(texts, *from, *to)
		return
	}

	// 单个翻译模式
	if *text == "" {
		// 如果没有提供text参数，从stdin读取
		data, err := io.ReadAll(os.Stdin)
		if err != nil {
			printError("Failed to read from stdin: " + err.Error())
			os.Exit(1)
		}
		*text = string(data)
	}

	if *text == "" {
		printError("No text provided. Use -text flag or pipe text to stdin")
		os.Exit(1)
	}

	handleSingleTranslate(*text, *from, *to)
}

// handleJSONMode 处理JSON模式
func handleJSONMode() {
	var req TranslateRequest

	// 从stdin读取JSON
	decoder := json.NewDecoder(os.Stdin)
	if err := decoder.Decode(&req); err != nil {
		printJSONError("Invalid JSON input: " + err.Error())
		os.Exit(1)
	}

	// 设置默认值
	if req.From == "" {
		req.From = "auto"
	}
	if req.To == "" {
		req.To = "en"
	}

	// 批量翻译
	if len(req.Texts) > 0 {
		handleBatchTranslateJSON(req.Texts, req.From, req.To)
		return
	}

	// 单个翻译
	if req.Text == "" {
		printJSONError("Text field is required")
		os.Exit(1)
	}

	handleSingleTranslateJSON(req.Text, req.From, req.To)
}

// handleSingleTranslate 处理单个翻译（普通模式）
func handleSingleTranslate(text, from, to string) {
	translated, err := gtranslate.TranslateWithParams(
		text,
		gtranslate.TranslationParams{
			From: from,
			To:   to,
		},
	)

	if err != nil {
		printError("Translation failed: " + err.Error())
		os.Exit(1)
	}

	fmt.Println(translated)
}

// handleSingleTranslateJSON 处理单个翻译（JSON模式）
func handleSingleTranslateJSON(text, from, to string) {
	translated, err := gtranslate.TranslateWithParams(
		text,
		gtranslate.TranslationParams{
			From: from,
			To:   to,
		},
	)

	response := TranslateResponse{
		From: from,
		To:   to,
	}

	if err != nil {
		response.Success = false
		response.Error = err.Error()
	} else {
		response.Success = true
		response.Original = text
		response.Translated = translated
	}

	printJSON(response)
}

// handleBatchTranslate 处理批量翻译（普通模式）- 使用有限并发
func handleBatchTranslate(texts []string, from, to string) {
	// 如果文本数量很少，直接顺序执行更快
	if len(texts) <= 3 {
		for _, text := range texts {
			if text == "" {
				continue
			}

			translated, err := gtranslate.TranslateWithParams(
				text,
				gtranslate.TranslationParams{
					From: from,
					To:   to,
				},
			)

			if err != nil {
				fmt.Fprintf(os.Stderr, "Error translating '%s': %s\n", text, err.Error())
				continue
			}

			fmt.Println(translated)
		}
		return
	}

	// 使用 Worker Pool 模式，限制并发数为 3
	const maxWorkers = 3

	type job struct {
		index int
		text  string
	}

	type result struct {
		index      int
		translated string
		err        error
	}

	jobs := make(chan job, len(texts))
	results := make(chan result, len(texts))

	// 创建 worker pool
	var wg sync.WaitGroup
	for w := 0; w < maxWorkers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				if j.text == "" {
					results <- result{index: j.index, translated: "", err: nil}
					continue
				}

				translated, err := gtranslate.TranslateWithParams(
					j.text,
					gtranslate.TranslationParams{
						From: from,
						To:   to,
					},
				)
				results <- result{index: j.index, translated: translated, err: err}
			}
		}()
	}

	// 发送任务
	for i, text := range texts {
		jobs <- job{index: i, text: text}
	}
	close(jobs)

	// 等待所有任务完成
	go func() {
		wg.Wait()
		close(results)
	}()

	// 收集结果
	translations := make(map[int]string)
	errors := make(map[int]error)

	for res := range results {
		if res.err != nil {
			errors[res.index] = res.err
		} else {
			translations[res.index] = res.translated
		}
	}

	// 按顺序输出
	for i := range texts {
		if err, ok := errors[i]; ok {
			fmt.Fprintf(os.Stderr, "Error translating '%s': %s\n", texts[i], err.Error())
			continue
		}
		if trans, ok := translations[i]; ok && trans != "" {
			fmt.Println(trans)
		}
	}
}

// handleBatchTranslateJSON 处理批量翻译（JSON模式）- 使用有限并发
func handleBatchTranslateJSON(texts []string, from, to string) {
	response := TranslateResponse{
		Success: true,
		From:    from,
		To:      to,
		Results: make([]Result, len(texts)),
	}

	// 如果文本数量很少，直接顺序执行更快（避免并发开销）
	if len(texts) <= 3 {
		for i, text := range texts {
			if text == "" {
				response.Results[i] = Result{Original: text, Translated: ""}
				continue
			}

			translated, err := gtranslate.TranslateWithParams(
				text,
				gtranslate.TranslationParams{
					From: from,
					To:   to,
				},
			)

			response.Results[i] = Result{
				Original:   text,
				Translated: translated,
			}

			if err != nil {
				response.Results[i].Translated = ""
			}
		}

		printJSON(response)
		return
	}

	// 使用 Worker Pool 模式，限制并发数为 3（避免 API 限流）
	const maxWorkers = 3

	type job struct {
		index int
		text  string
	}

	type indexedResult struct {
		index  int
		result Result
	}

	jobs := make(chan job, len(texts))
	results := make(chan indexedResult, len(texts))

	// 创建 worker pool
	var wg sync.WaitGroup
	for w := 0; w < maxWorkers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				if j.text == "" {
					results <- indexedResult{
						index:  j.index,
						result: Result{Original: j.text, Translated: ""},
					}
					continue
				}

				translated, err := gtranslate.TranslateWithParams(
					j.text,
					gtranslate.TranslationParams{
						From: from,
						To:   to,
					},
				)

				res := Result{
					Original:   j.text,
					Translated: translated,
				}

				if err != nil {
					res.Translated = ""
				}

				results <- indexedResult{index: j.index, result: res}
			}
		}()
	}

	// 发送任务
	for i, text := range texts {
		jobs <- job{index: i, text: text}
	}
	close(jobs)

	// 等待所有任务完成
	go func() {
		wg.Wait()
		close(results)
	}()

	// 收集所有结果
	for res := range results {
		response.Results[res.index] = res.result
	}

	printJSON(response)
}

// printJSON 输出JSON
func printJSON(v interface{}) {
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	encoder.Encode(v)
}

// printJSONError 输出JSON错误
func printJSONError(message string) {
	response := TranslateResponse{
		Success: false,
		Error:   message,
	}
	printJSON(response)
}

// printError 输出错误信息
func printError(message string) {
	fmt.Fprintf(os.Stderr, "Error: %s\n", message)
}

// showHelp 显示帮助信息
func showHelp() {
	fmt.Print(`
翻译命令行工具
==================
用法:
  translate [选项]

选项:
  -text string      要翻译的文本
  -from string      源语言 (默认: "auto")
  -to string        目标语言 (默认: "en")
  -json             使用 JSON 输入/输出模式
  -batch            批量翻译模式 (逗号分隔的文本)
  -server           运行 HTTP 服务器模式
  -port string      HTTP 服务器端口 (默认: "8080")
  -help             显示此帮助信息

示例:

  1. 基础翻译:
     ./translate -text "Hello World" -from en -to zh-CN

  2. 自动检测源语言:
     ./translate -text "Bonjour" -to en

  3. 从标准输入翻译:
     echo "Hello" | ./translate -to zh-CN

  4. JSON 模式 (用于 Node.js 集成):
     echo '{"text":"Hello","from":"en","to":"zh-CN"}' | ./translate -json

  5. 批量翻译 JSON 模式:
     echo '{"texts":["Hello","World"],"from":"en","to":"zh-CN"}' | ./translate -json

  6. 批量翻译 (逗号分隔):
     ./translate -text "Hello,World,Test" -batch -to zh-CN

  7. HTTP 服务器模式:
     ./translate -server -port 8080

常用语言代码:
  en      英语
  zh-CN   中文 (简体)
  zh-TW   中文 (繁体)
  ja      日语
  ko      韩语
  fr      法语
  de      德语
  es      西班牙语
  ru      俄语
  ar      阿拉伯语
  pt      葡萄牙语
  it      意大利语
  th      泰语
  vi      越南语
  auto    自动检测 (仅限源语言)
`)
}

// startHTTPServer 启动 HTTP 服务器
func startHTTPServer(port string) {
	// CORS 中间件
	corsMiddleware := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next(w, r)
		}
	}

	// 注册路由
	http.HandleFunc("/api/translate", corsMiddleware(handleTranslateAPI))
	http.HandleFunc("/api/translate/batch", corsMiddleware(handleBatchTranslateAPI))

	// 健康检查端点
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", contentTypeJSON)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	addr := ":" + port
	log.Printf("🚀 Translation HTTP Server is running on http://localhost%s\n", addr)
	log.Printf("📡 API Endpoints:")
	log.Printf("   - POST /api/translate")
	log.Printf("   - POST /api/translate/batch")
	log.Printf("   - GET  /health")

	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal("Server failed to start: ", err)
	}
}

// translateWithTimeout 带超时的翻译函数
func translateWithTimeout(text, from, to string, timeout time.Duration) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	resultChan := make(chan string, 1)
	errChan := make(chan error, 1)

	go func() {
		translated, err := gtranslate.TranslateWithParams(
			text,
			gtranslate.TranslationParams{
				From: from,
				To:   to,
			},
		)
		if err != nil {
			errChan <- err
		} else {
			resultChan <- translated
		}
	}()

	select {
	case <-ctx.Done():
		return "", fmt.Errorf("translation timeout after %v", timeout)
	case err := <-errChan:
		return "", err
	case result := <-resultChan:
		return result, nil
	}
}

// handleTranslateAPI 处理单个翻译请求
func handleTranslateAPI(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req TranslateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, TranslateResponse{
			Success: false,
			Error:   "Invalid JSON: " + err.Error(),
		})
		return
	}

	// 设置默认值
	if req.From == "" {
		req.From = "auto"
	}
	if req.To == "" {
		req.To = "en"
	}

	if req.Text == "" {
		respondJSON(w, TranslateResponse{
			Success: false,
			Error:   "Text field is required",
		})
		return
	}

	// 执行翻译（30秒超时）
	translated, err := translateWithTimeout(req.Text, req.From, req.To, 30*time.Second)

	response := TranslateResponse{
		From: req.From,
		To:   req.To,
	}

	if err != nil {
		response.Success = false
		response.Error = err.Error()
		log.Printf("Translation error: %v", err)
	} else {
		response.Success = true
		response.Original = req.Text
		response.Translated = translated
	}

	respondJSON(w, response)
}

// handleBatchTranslateAPI 处理批量翻译请求
func handleBatchTranslateAPI(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req TranslateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, TranslateResponse{
			Success: false,
			Error:   "Invalid JSON: " + err.Error(),
		})
		return
	}

	// 设置默认值
	if req.From == "" {
		req.From = "auto"
	}
	if req.To == "" {
		req.To = "en"
	}

	// 判断是单个文本还是批量文本
	var texts []string
	if req.Text != "" {
		// 单个长文本，可以分段处理
		texts = []string{req.Text}
	} else if len(req.Texts) > 0 {
		texts = req.Texts
	} else {
		respondJSON(w, TranslateResponse{
			Success: false,
			Error:   "Text or Texts field is required",
		})
		return
	}

	// 如果只有一个文本，直接翻译返回
	if len(texts) == 1 {
		translated, err := translateWithTimeout(texts[0], req.From, req.To, 30*time.Second)

		response := TranslateResponse{
			From:    req.From,
			To:      req.To,
			Success: true,
		}

		if err != nil {
			response.Success = false
			response.Error = err.Error()
			log.Printf("Translation error: %v", err)
		} else {
			response.Original = texts[0]
			response.Translated = translated
		}

		respondJSON(w, response)
		return
	}

	// 批量翻译
	response := TranslateResponse{
		Success: true,
		From:    req.From,
		To:      req.To,
		Results: make([]Result, len(texts)),
	}

	// 使用 Worker Pool，限制并发数
	const maxWorkers = 3

	type job struct {
		index int
		text  string
	}

	type indexedResult struct {
		index  int
		result Result
	}

	jobs := make(chan job, len(texts))
	results := make(chan indexedResult, len(texts))

	// 创建 worker pool
	var wg sync.WaitGroup
	for w := 0; w < maxWorkers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				if j.text == "" {
					results <- indexedResult{
						index:  j.index,
						result: Result{Original: j.text, Translated: ""},
					}
					continue
				}

				translated, err := translateWithTimeout(j.text, req.From, req.To, 30*time.Second)

				res := Result{
					Original:   j.text,
					Translated: translated,
				}

				if err != nil {
					res.Translated = ""
					log.Printf("Translation error for text %d: %v", j.index, err)
				}

				results <- indexedResult{index: j.index, result: res}
			}
		}()
	}

	// 发送任务
	for i, text := range texts {
		jobs <- job{index: i, text: text}
	}
	close(jobs)

	// 等待所有任务完成
	go func() {
		wg.Wait()
		close(results)
	}()

	// 收集所有结果
	for res := range results {
		response.Results[res.index] = res.result
	}

	respondJSON(w, response)
}

// respondJSON 返回 JSON 响应
func respondJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", contentTypeJSON)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
	}
}
