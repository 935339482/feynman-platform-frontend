// src/pages/FeynmanRecordPage.jsx
// 费曼复述页：对知识点录音 → 自动上传 → 百度AI转录 → 显示文字
import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';
import useRecorder from '../hooks/useRecorder';

function FeynmanRecordPage() {
    const { id } = useParams(); // 知识点ID
    const [kpTitle, setKpTitle] = useState('');
    const [transcribedText, setTranscribedText] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // 停止录音后自动上传转录
    const uploadAudio = useCallback(async (blobUrl) => {
        setIsUploading(true);
        setTranscribedText('');
        try {
            const audioBlob = await fetch(blobUrl).then((r) => r.blob());
            const audioFile = new File([audioBlob], `feynman-record-${id}.wav`, { type: 'audio/wav' });

            const formData = new FormData();
            formData.append('audio', audioFile); // 'audio' 和后端 multer 字段名一致

            const response = await apiClient.post('/audio/transcribe', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setTranscribedText(response.data.result);
        } catch (error) {
            console.error('上传或转录失败', error);
            setTranscribedText(error.response?.data?.msg || '转录失败，请重试。');
        } finally {
            setIsUploading(false);
        }
    }, [id]);

    const { status, startRecording, stopRecording, mediaBlobUrl, error: recError } = useRecorder({
        onStop: (blobUrl) => uploadAudio(blobUrl),
    });

    useEffect(() => {
        // 获取知识点标题用于显示
        const fetchKpTitle = async () => {
            try {
                const response = await apiClient.get(`/knowledge-points/${id}`);
                setKpTitle(response.data.title);
            } catch (err) {
                console.error(err);
                setKpTitle('(加载失败)');
            }
        };
        fetchKpTitle();
    }, [id]);

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h1>复述知识点: {kpTitle}</h1>
            <p>想象你在把这个概念讲给一个完全不懂的人听——用最简单的话。</p>
            <p>录音状态: <strong>{status}</strong></p>
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
            <div style={{ border: '1px solid #ccc', padding: '1rem', minHeight: '100px', whiteSpace: 'pre-wrap' }}>
                {transcribedText}
            </div>
        </div>
    );
}
export default FeynmanRecordPage;
