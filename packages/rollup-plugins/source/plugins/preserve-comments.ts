import * as acorn from "acorn";
import { createFilter, FilterPattern } from "@rollup/pluginutils";
import MagicString from "magic-string";

type CommentPreservingCallback = (comment: acorn.Comment) => boolean;

export const defaultCommentPreservingCallback: CommentPreservingCallback = (comment) =>
{
    return comment.value.startsWith("*") || comment.value.startsWith("!") || comment.value.startsWith("@");
}

export interface PreserveCommentsOptions
{
    /**
     * A boolean means indicating whether to preserve all comments,
     * a string array means every comment that contains any of the strings will be preserved,
     * or a function that takes a comment and returns a boolean indicating whether to preserve it.
     */
    shouldPreserve?: boolean | string[] | CommentPreservingCallback;

    include?: FilterPattern;
    exclude?: FilterPattern;

    /**
     * Modify the sourcemap of the output code to match the changes made to the code.
     * When there're a large amount of files, it may slow down the build process.
     * When you don't need sourcemaps, you can set it to false to speed up the build process.
     * @default true
     */
    sourcemap?: boolean;
}

/**
 * A Rollup plugin that handles comments in the code, you're in full control of which comments to keep and which to remove.
 * NOTE: You ALWAYS need to set 'removeComments' to false in the tsconfig when this plugin is used.
 */
export default function preserveComments(options: PreserveCommentsOptions = {}) 
{
    const {
        shouldPreserve = false,
        include,
        exclude
    } = options;

    return {
        name: "preserve-comments",
        renderChunk(code: string, chunk: any) 
        {
            // 检查文件后缀名

            const filter = createFilter(include, exclude);
            if (!filter(chunk.facadeModuleId)) 
            {
                this.warn(`Skipping preserve-comments for ${ chunk.facadeModuleId }`);
                return null;
            }

            try
            {
                const comments: acorn.Comment[] = [];
                acorn.parse(code,
                    {
                        ecmaVersion: "latest",
                        onComment: comments,
                        sourceType: "module",
                    }) as any;

                let shouldKeepComment: CommentPreservingCallback = defaultCommentPreservingCallback;

                if (typeof shouldPreserve === "boolean") 
                {
                    shouldKeepComment = () => shouldPreserve;
                }
                else if (typeof shouldPreserve === "function") 
                {
                    shouldKeepComment = shouldPreserve;
                }
                else if (Array.isArray(shouldPreserve)) 
                {
                    const preserveSet = new Set(shouldPreserve.map((item: string) => item.toLowerCase()));
                    shouldKeepComment = (comment) => 
                    {
                        const commentLower = comment.value.toLowerCase();
                        return [...preserveSet].some(preserve => commentLower.includes(preserve));
                    }
                }

                const s = new MagicString(code);

                comments.forEach(comment =>
                {
                    if (!shouldKeepComment(comment))
                    {
                        let start = comment.start;
                        // 向前搜索，直到找到非空白字符或字符串起始位置
                        while (start > 0 && " \t\r\n".includes(code[start - 1]))
                        {
                            start--;
                        }

                        let end = comment.end;
                        // 向后搜索，直到找到非空白字符或字符串结束位置
                        while (end < code.length && " \t\r\n".includes(code[end]))
                        {
                            end++;
                        }

                        // 如果此时的end位置是一个换行符，再向后推进一位，以删除整个空行
                        if (code[end] === "\n")
                        {
                            end++;
                        }

                        s.remove(start, end);
                    }
                });

                const newCode = s.toString();
                const newMap = (options.sourcemap ?? true) ? s.generateMap({ hires: true }) : null;

                return {
                    code: newCode,
                    map: newMap
                };
            }
            catch (e)
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
