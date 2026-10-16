// src/pages/FeynmanRecordPage.jsx
// 费曼复述页：录音 → 上传转录 → AI润色+智能评价打分 → 低分自动加入复习列表
import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';
import useRecorder from '../hooks/useRecorder';

// 低于该分数自动进入复习列表（课后挑战作业）
const REVIEW_THRESHOLD = 60;

function FeynmanRecordPage() {
    const { id } = useParams(); // 知识点ID
    const [kp, setKp] = useState({ title: '', content: '' });
    const [transcribedText, setTranscribedText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [aiError, setAiError] = useState('');
    const [reviewMarked, setReviewMarked] = useState(false);

    // AI 评价：转录成功后，拿原始知识点内容 + 复述文本请求大模型
    const getAiEvaluation = useCallback(
        async (transcribed) => {
            setIsEvaluating(true);
            setAiFeedback(null);
            setAiError('');
            setReviewMarked(false);
            try {
                const response = await apiClient.post('/audio/evaluate', {
                    originalContent: kp.content,
                    transcribedText: transcribed,
                });
                const feedback = response.data;
                setAiFeedback(feedback);

                // 挑战作业：分数低于阈值，自动把该知识点加入复习列表
                if (feedback.score < REVIEW_THRESHOLD) {
                    await apiClient.put(`/knowledge-points/${id}`, { reviewList: true });
                    setReviewMarked(true);
                }
            } catch (error) {
                console.error('获取AI评价失败', error);
                setAiError(error.response?.data?.msg || 'AI评价失败，请稍后再试。');
            } finally {
                setIsEvaluating(false);
            }
        },
        [kp.content, id]
    );

    // 停止录音后自动上传转录
    const uploadAudio = useCallback(
        async (blobUrl) => {
            setIsUploading(true);
            setTranscribedText('');
            setAiFeedback(null);
            setAiError('');
            try {
                const audioBlob = await fetch(blobUrl).then((r) => r.blob());
                const audioFile = new File([audioBlob], `feynman-record-${id}.wav`, { type: 'audio/wav' });

                const formData = new FormData();
                formData.append('audio', audioFile); // 'audio' 和后端 multer 字段名一致

                const response = await apiClient.post('/audio/transcribe', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                const text = response.data.result;
                setTranscribedText(text);
                // 转录成功后自动触发 AI 评价
                if (text) getAiEvaluation(text);
            } catch (error) {
                console.error('上传或转录失败', error);
                setTranscribedText(error.response?.data?.msg || '转录失败，请重试。');
            } finally {
                setIsUploading(false);
            }
        },
        [id, getAiEvaluation]
    );

    const { status, startRecording, stopRecording, mediaBlobUrl, error: recError } = useRecorder({
        onStop: (blobUrl) => uploadAudio(blobUrl),
    });

    useEffect(() => {
        // 获取知识点（标题用于展示，内容用于 AI 对照评价）
        const fetchKp = async () => {
            try {
                const response = await apiClient.get(`/knowledge-points/${id}`);
                setKp({ title: response.data.title, content: response.data.content });
            } catch (err) {
                console.error(err);
                setKp({ title: '(加载失败)', content: '' });
            }
        };
        fetchKp();
    }, [id]);

    const scoreColor = aiFeedback && aiFeedback.score >= 80 ? 'green' : aiFeedback.score >= 60 ? 'orange' : 'red';

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1>复述知识点: {kp.title}</h1>
            <p>想象你在把这个概念讲给一个完全不懂的人听——用最简单的话。</p>
            <p>
                录音状态: <strong>{status}</strong>
            </p>
            {recError && <p style={{ color: 'red' }}>{recError}</p>}

            <button onClick={startRecording} disabled={status === 'recording'}>
                开始录音
            </button>
            <button onClick={stopRecording} disabled={status !== 'recording'} style={{ marginLeft: '10px' }}>
                停止录音
            </button>

            {mediaBlobUrl && (
                <div style={{ marginTop: '1rem' }}>
                    <p>回放你的复述:</p>
                    <audio src={mediaBlobUrl} controls />
                </div>
            )}

            <hr />

            <h2>AI 转录结果:</h2>
            {isUploading && <p>正在上传并转录，请稍候...</p>}
            <div style={{ border: '1px solid #ccc', padding: '1rem', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                {transcribedText}
            </div>

            <hr />

            <h2>AI 教练反馈:</h2>
            {isEvaluating && <p>AI教练正在批阅你的答卷，请稍候（约10秒）...</p>}
            {aiError && <p style={{ color: 'red' }}>{aiError}</p>}

            {aiFeedback && (
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ flex: 1 }}>
                        <h3>AI 润色后的文本</h3>
                        <p style={{ background: '#eef', padding: '1rem', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                            {aiFeedback.polishedText}
                        </p>

                        <h3>综合评价</h3>
                        <p>{aiFeedback.evaluation}</p>

                        <h3>优点 👍</h3>
                        <ul>
                            {aiFeedback.strengths.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>

                        <h3>待改进 👇</h3>
                        <ul>
                            {aiFeedback.weaknesses.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                    <div style={{ flex: '0 0 150px', textAlign: 'center' }}>
                        <h3>综合得分</h3>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: scoreColor }}>
                            {aiFeedback.score}
                        </div>
                        {reviewMarked && (
                            <p style={{ color: 'red', fontWeight: 'bold' }}>
                                🔴 分数低于{REVIEW_THRESHOLD}分
                                <br />
                                已自动加入复习列表
                            </p>
                        )}
                        {aiFeedback.model && (
                            <p style={{ color: '#999', fontSize: '12px' }}>模型: {aiFeedback.model}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
export default FeynmanRecordPage;
