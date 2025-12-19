import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// Go 可执行文件路径
const TRANSLATE_BIN = path.join(process.cwd(), 'translate');

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

export async function POST(request: NextRequest) {
  try {
    const { text, from = 'auto', to = 'en' } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: '文本不能为空' },
        { status: 400 }
      );
    }

    const cleanText = text.trim();
    
    // 分割文本
    const sentences = splitTextIntoSentences(cleanText);
    
    console.log(`长文本翻译: ${cleanText.length} 字符, 分割成 ${sentences.length} 个片段`);

    // 批量翻译 - 使用 spawn 避免 shell 转义问题
    const input = JSON.stringify({ texts: sentences, from, to });
    
    const result = await new Promise<any>((resolve, reject) => {
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
      
      child.stdin.write(input);
      child.stdin.end();
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || '翻译失败' },
        { status: 500 }
      );
    }

    // 合并翻译结果
    const translated = result.results.map((r: any) => r.translated).join('');
    
    // 获取检测到的语言
    let detectedLang = from;
    if (from === 'auto' && sentences.length > 0) {
      const firstInput = JSON.stringify({ text: sentences[0], from, to });
      const firstResult = await new Promise<any>((resolve, reject) => {
        const child = spawn(TRANSLATE_BIN, ['-json']);
        
        let stdout = '';
        
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            try {
              resolve(JSON.parse(stdout));
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(`Process exited with code ${code}`));
          }
        });
        
        child.stdin.write(firstInput);
        child.stdin.end();
      });
      detectedLang = firstResult.from;
    }

    console.log(`长文本翻译完成: ${translated.length} 字符`);

    return NextResponse.json({
      success: true,
      original: cleanText,
      translated,
      from: result.from,
      to: result.to,
      detectedLang: from === 'auto' ? detectedLang : undefined,
      segmentCount: sentences.length,
    });

  } catch (error: any) {
    console.error('Batch translation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '批量翻译失败' },
      { status: 500 }
    );
  }
}

