// src/components/Mermaid.jsx
// 自定义组件：渲染 Mermaid 代码块为 SVG 图表
import { useState, useEffect } from 'react';
import mermaid from 'mermaid';

let mermaidIdCounter = 0; // 全局计数器，保证每个图表有唯一 id

mermaid.initialize({ startOnLoad: false, theme: 'default' });

function Mermaid({ chart }) {
    const [svg, setSvg] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const text = (chart || '').trim();
        // 防御：空内容直接提示，不调用 mermaid（否则报 text: undefined）
        if (!text) {
            setError('mermaid 代码块内容为空，请编辑知识点补全图表代码');
            return;
        }
        const id = `mermaid-svg-${++mermaidIdCounter}`;
        // 先用 parse 预检语法（无效时抛错），再做真正渲染
        mermaid
            .parse(text)
            .then(() => mermaid.render(id, text))
            .then(({ svg }) => {
                if (!cancelled) setSvg(svg);
            })
            .catch((err) => {
                if (!cancelled) setError('Mermaid 语法错误：' + (err.message || err));
            });
        return () => {
            cancelled = true;
        };
    }, [chart]);

    if (error) return <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error}</pre>;
    if (!svg) return <p>图表渲染中...</p>;
    // 渲染出的 SVG 由 mermaid 生成（可信来源），此处直接插入
    return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
export default Mermaid;
