'use server';

import { spawn } from 'child_process';
import path from 'path';

// Go 可执行文件路径
const TRANSLATE_BIN = path.join(process.cwd(), 'translate');

interface TranslateResult {
  success: boolean;
  original?: string;
  translated?: string;
  from?: string;
  to?: string;
  error?: string;
}

interface BatchTranslateResult extends TranslateResult {
  detectedLang?: string;
  segmentCount?: number;
}

// 辅助函数：执行 Go 翻译工具
async function executeTranslate(input: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn(TRANSLATE_BIN, ['-json']);
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error}`));
      }
    });
    
    child.on('error', (error) => {
      reject(new Error(`Failed to spawn process: ${error.message}`));
    });
    
    child.stdin.write(input);
    child.stdin.end();
  });
}

// 将长文本按句子分割
function splitTextIntoSentences(text: string, maxLength = 500): string[] {
  const sentences: string[] = [];
  
  // 按标点符号分割
  const splits = text.split(/([。！？.!?\n]+)/);
  
  let currentChunk = '';
  
  for (let i = 0; i < splits.length; i++) {
    const part = splits[i];
    
    if (currentChunk.length + part.length <= maxLength) {
      currentChunk += part;
    } else {
      if (currentChunk.trim()) {
        sentences.push(currentChunk.trim());
      }
      currentChunk = part;
    }
  }
  
  if (currentChunk.trim()) {
    sentences.push(currentChunk.trim());
  }
  
  return sentences.filter(s => s.length > 0);
}

/**
 * Server Action: 翻译单个文本
 */
export async function translateText(
  text: string,
  from: string = 'auto',
  to: string = 'en'
): Promise<TranslateResult> {
  try {
    if (!text || !text.trim()) {
      return {
        success: false,
        error: '文本不能为空',
      };
    }

    const input = JSON.stringify({ text: text.trim(), from, to });
    const result = await executeTranslate(input);

    if (!result.success) {
      return {
        success: false,
        error: result.error || '翻译失败',
      };
    }

    return {
      success: true,
      original: result.original,
      translated: result.translated,
      from: result.from,
      to: result.to,
    };
  } catch (error: any) {
    console.error('Translation error:', error);
    return {
      success: false,
      error: error.message || '翻译失败',
    };
  }
}

/**
 * Server Action: 批量翻译长文本
 */
export async function translateLongText(
  text: string,
  from: string = 'auto',
  to: string = 'en'
): Promise<BatchTranslateResult> {
  try {
    if (!text || !text.trim()) {
      return {
        success: false,
        error: '文本不能为空',
      };
    }

    const cleanText = text.trim();
    
    // 分割文本
    const sentences = splitTextIntoSentences(cleanText);
    
    console.log(`[Server Action] 长文本翻译: ${cleanText.length} 字符, 分割成 ${sentences.length} 个片段`);

    // 批量翻译
    const input = JSON.stringify({ texts: sentences, from, to });
    const result = await executeTranslate(input);

    if (!result.success) {
      return {
        success: false,
        error: result.error || '翻译失败',
      };
    }

    // 合并翻译结果
    const translated = result.results.map((r: any) => r.translated).join('');
    
    // 获取检测到的语言
    let detectedLang = from;
    if (from === 'auto' && sentences.length > 0) {
      const firstInput = JSON.stringify({ text: sentences[0], from, to });
      const firstResult = await executeTranslate(firstInput);
      detectedLang = firstResult.from;
    }

    console.log(`[Server Action] 长文本翻译完成: ${translated.length} 字符`);

    return {
      success: true,
      original: cleanText,
      translated,
      from: result.from,
      to: result.to,
      detectedLang: from === 'auto' ? detectedLang : undefined,
      segmentCount: sentences.length,
    };
  } catch (error: any) {
    console.error('[Server Action] Batch translation error:', error);
    return {
      success: false,
      error: error.message || '批量翻译失败',
    };
  }
}

/**
 * Server Action: 智能翻译（自动判断长短文本）
 */
export async function smartTranslate(
  text: string,
  from: string = 'auto',
  to: string = 'en'
): Promise<TranslateResult | BatchTranslateResult> {
  const isLongText = text.length > 500;
  
  if (isLongText) {
    return translateLongText(text, from, to);
  } else {
    return translateText(text, from, to);
  }
}

