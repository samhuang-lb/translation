import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// Go 可执行文件路径
const TRANSLATE_BIN = path.join(process.cwd(), 'translate');

export async function POST(request: NextRequest) {
  try {
    const { text, from = 'auto', to = 'en' } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: '文本不能为空' },
        { status: 400 }
      );
    }

    // 使用 spawn 和 stdin 来避免 shell 转义问题
    const input = JSON.stringify({ text: text.trim(), from, to });
    
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

    return NextResponse.json({
      success: true,
      original: result.original,
      translated: result.translated,
      from: result.from,
      to: result.to,
    });

  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '翻译失败' },
      { status: 500 }
    );
  }
}

