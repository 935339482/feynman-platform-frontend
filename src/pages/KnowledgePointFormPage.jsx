// src/pages/KnowledgePointFormPage.jsx
// 新建 / 编辑知识点共用的表单页（Markdown 格式）
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';

function KnowledgePointFormPage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); // 存储原始 Markdown
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    // 编辑模式：先拉取已有内容填进表单
    useEffect(() => {
        if (!isEditing) return;
        const fetchKp = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/knowledge-points/${id}`);
                setTitle(response.data.title);
                setContent(response.data.content);
            } catch (err) {
                setError('加载知识点失败');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchKp();
    }, [id, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const kpData = { title, content };
        try {
            if (isEditing) {
                await apiClient.put(`/knowledge-points/${id}`, kpData);
            } else {
                await apiClient.post('/knowledge-points', kpData);
            }
            navigate('/'); // 保存成功后回到列表
        } catch (err) {
            console.error('保存知识点失败', err);
            setError(err.response?.data?.msg || '保存失败，请稍后再试');
        }
    };

    if (loading) return <p>加载中...</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1>{isEditing ? '编辑知识点' : '新建知识点'}</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>标题:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <label>内容（支持 Markdown / $公式$ / ```mermaid 图表）:</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        rows={14}
                        style={{ width: '100%', padding: '8px', fontFamily: 'monospace' }}
                        placeholder={'# 标题\n\n- 列表项\n\n行内公式: $E=mc^2$\n\n```mermaid\ngraph TD; A-->B;\n```'}
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" style={{ marginTop: '1rem', padding: '8px 24px' }}>
                    {isEditing ? '更新' : '创建'}
                </button>
            </form>
        </div>
    );
}
export default KnowledgePointFormPage;
