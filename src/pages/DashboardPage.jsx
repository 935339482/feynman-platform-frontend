// src/pages/DashboardPage.jsx
// 学习主页：知识点列表 + Markdown/公式/Mermaid 富文本渲染
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // KaTeX 公式样式
import apiClient from '../api/axios';
import Mermaid from '../components/Mermaid';

function DashboardPage() {
    const [knowledgePoints, setKnowledgePoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchKnowledgePoints = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/knowledge-points');
                setKnowledgePoints(response.data);
            } catch (err) {
                setError('获取知识点失败');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchKnowledgePoints();
    }, []); // 空依赖数组：只在组件首次挂载时执行一次

    const handleDelete = async (id) => {
        if (window.confirm('你确定要删除这个知识点吗？')) {
            try {
                await apiClient.delete(`/knowledge-points/${id}`);
                // 从前端状态中移除被删除的项，避免刷新页面
                setKnowledgePoints(knowledgePoints.filter((kp) => kp._id !== id));
            } catch (err) {
                console.error('删除失败', err);
            }
        }
    };

    if (loading) return <p>加载中...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1>我的知识点</h1>
            <Link to="/kp/new">
                <button>+ 新建知识点</button>
            </Link>

            <div style={{ marginTop: '20px' }}>
                {knowledgePoints.length === 0 ? (
                    <p>你还没有任何知识点，快去创建一个吧！</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {knowledgePoints.map((kp) => (
                            <li
                                key={kp._id}
                                style={{ border: '1px solid #ccc', margin: '10px 0', padding: '16px', borderRadius: '8px' }}
                            >
                                <h2 style={{ marginTop: 0 }}>{kp.title}</h2>
                                <p>
                                    状态: {kp.status} | 加入复习: {kp.reviewList ? '是' : '否'}
                                </p>
                                <div
                                    className="markdown-content"
                                    style={{ background: '#f9f9f9', padding: '12px', borderRadius: '5px' }}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            // 覆盖代码块渲染：mermaid 语言块交给 Mermaid 组件画图
                                            code({ node, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                if (match && match[1] === 'mermaid') {
                                                    // 优先从 AST 节点取原始文本（最可靠），回退到 children
                                                    const raw =
                                                        node?.children?.[0]?.value ??
                                                        String(children ?? '');
                                                    return <Mermaid chart={raw.replace(/\n$/, '')} />;
                                                }
                                                return (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                        }}
                                    >
                                        {kp.content}
                                    </ReactMarkdown>
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <Link to={`/feynman/${kp._id}`}>
                                        <button style={{ background: 'green', color: 'white' }}>开始复述</button>
                                    </Link>
                                    <Link to={`/kp/edit/${kp._id}`}>
                                        <button style={{ marginLeft: '10px' }}>编辑</button>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(kp._id)}
                                        style={{ marginLeft: '10px', background: 'red', color: 'white' }}
                                    >
                                        删除
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
export default DashboardPage;
