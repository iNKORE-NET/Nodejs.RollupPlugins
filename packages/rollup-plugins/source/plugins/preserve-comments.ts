import * as acorn from 'acorn';
import { walk } from 'estree-walker';
import { createFilter, FilterPattern } from '@rollup/pluginutils';
import MagicString from "magic-string";
import { OutputOptions } from "rollup";

interface PreserveCommentsOptions {
  shouldPreserve?: boolean | string[] | ((comment: string) => boolean);
  include?: FilterPattern;
  exclude?: FilterPattern;
}

export default function preserveComments(options: PreserveCommentsOptions = {}, outputOptions: OutputOptions = {}) 
{
    const 
    {
        shouldPreserve = false,
        include,
        exclude
    } = options;

  return {
    name: 'preserve-comments',
    renderChunk(code: string, chunk: any) {
      // 检查文件后缀名
      
        const filter = createFilter(include, exclude);
              if (!filter(chunk.facadeModuleId)) {
        return null;
      }
    try
      {
        if (!chunk.facadeModuleId || !/\.(ts|tsx|js|jsx)$/.test(chunk.facadeModuleId)) {
        return null; // 不处理非目标文件
      }

      const comments: acorn.Comment[] = [];
      const ast = acorn.parse(code, {
        ecmaVersion: "latest",
        onComment: comments,
        sourceType: "module",
      }) as any;

      let shouldKeepComment: (comment: string) => boolean;

      if (typeof shouldPreserve === 'boolean') 
      {
        shouldKeepComment = () => shouldPreserve;
      } else if (typeof shouldPreserve === 'function') 
      {
        shouldKeepComment = shouldPreserve;
      } else if (Array.isArray(shouldPreserve)) 
      {
        const preserveSet = new Set(shouldPreserve.map((item: string) => item.toLowerCase()));
        shouldKeepComment = (comment) => 
        {  
            const commentLower = comment.toLowerCase();
            return [...preserveSet].some(preserve => commentLower.includes(preserve));
        }//shouldPreserve.includes(comment);
      } else {
        // Default to not preserving comments
        shouldKeepComment = () => false;
      }

      // Filter out comments based on the shouldPreserve condition
    //   for (let i = comments.length - 1; i >= 0; i--) {
    //     const comment = comments[i];
    //     if (!shouldKeepComment(comment.value)) {
    //       comments.splice(i, 1);
    //     }
    //   }

    //   let newCode = '';
    //   let lastIndex = 0;
    //   walk(ast, {
    //     enter(node: any) {
    //       if (node.type === 'Program' && comments.length) {
    //         comments.forEach(comment => {
    //           const { start, end } = comment;
    //           newCode += code.slice(lastIndex, start);
    //           lastIndex = end;
    //           if (shouldKeepComment(comment.value)) {
    //             newCode += code.slice(start, end);
    //           }
    //         });
    //         newCode += code.slice(lastIndex);
    //       }
    //     }
    //   });

    // 使用MagicString方便地修改源代码
        const s = new MagicString(code);

        // comments.forEach(comment => {
        // if (!shouldKeepComment(comment.value)) {
        //     s.remove(comment.start, comment.end);
        // }
        // });
        // const newCode = s.toString();

            comments.forEach(comment => {
        if (!shouldKeepComment(comment.value)) {
          let start = comment.start;
          // 向前搜索，直到找到非空白字符或字符串起始位置
          while (start > 0 && " \t\r\n".includes(code[start - 1])) {
            start--;
          }

          let end = comment.end;
          // 向后搜索，直到找到非空白字符或字符串结束位置
          while (end < code.length && " \t\r\n".includes(code[end])) {
            end++;
          }

          // 如果此时的end位置是一个换行符，再向后推进一位，以删除整个空行
          if (code[end] === '\n') {
            end++;
          }

          s.remove(start, end);
        }
      });

      const newCode = s.toString();
      const newMap = outputOptions.sourcemap ? s.generateMap({ hires: true }) : null;

      return {
        code: newCode || code,
        map: newMap
      };
      }
      catch(e)
      {
        this.error(chunk.facadeModuleId);
        return {
        code: null,
        map: null
      };
      }
    }
  };
}
