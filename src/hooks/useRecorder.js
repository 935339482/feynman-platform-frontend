// src/hooks/useRecorder.js
// 自研录音 Hook：getUserMedia 采集麦克风 → AudioContext(16kHz) 重采样
// → ScriptProcessor 收集 PCM → 停止时编码为标准 16kHz 16bit 单声道 WAV
// （MediaRecorder 默认产出 webm，百度语音识别不支持，所以自己录 WAV）
import { useState, useRef, useCallback, useEffect } from 'react';

function encodeWav(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeStr = (offset, s) => {
        for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);            // PCM块大小
    view.setUint16(20, 1, true);             // 格式: PCM
    view.setUint16(22, 1, true);             // 单声道
    view.setUint32(24, sampleRate, true);    // 采样率
    view.setUint32(28, sampleRate * 2, true);// 字节率
    view.setUint16(32, 2, true);             // 块对齐
    view.setUint16(34, 16, true);            // 16bit
    writeStr(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    let o = 44;
    for (let i = 0; i < samples.length; i++, o += 2) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([view], { type: 'audio/wav' });
}

export default function useRecorder({ onStop } = {}) {
    const [status, setStatus] = useState('idle'); // idle | recording | stopped
    const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
    const [error, setError] = useState('');
    const streamRef = useRef(null);
    const ctxRef = useRef(null);
    const processorRef = useRef(null);
    const chunksRef = useRef([]);
    const onStopRef = useRef(onStop);
    onStopRef.current = onStop;

    const startRecording = useCallback(async () => {
        try {
            setError('');
            setMediaBlobUrl(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            // 指定 16000 采样率，浏览器会自动把麦克风(48k)重采样成16k
            const ctx = new AudioContext({ sampleRate: 16000 });
            ctxRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const processor = ctx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            chunksRef.current = [];
            processor.onaudioprocess = (e) => {
                chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
            };
            source.connect(processor);
            processor.connect(ctx.destination);
            setStatus('recording');
        } catch (err) {
            console.error('麦克风访问失败', err);
            setError('无法访问麦克风：' + (err.message || '请检查浏览器权限（需 HTTPS 或 localhost）'));
            setStatus('idle');
        }
    }, []);

    const stopRecording = useCallback(() => {
        const ctx = ctxRef.current;
        const stream = streamRef.current;
        if (!ctx || !stream) return;

        const total = chunksRef.current.reduce((n, c) => n + c.length, 0);
        const pcm = new Float32Array(total);
        let off = 0;
        for (const c of chunksRef.current) {
            pcm.set(c, off);
            off += c.length;
        }
        const sampleRate = ctx.sampleRate;

        // 清理资源
        if (processorRef.current) processorRef.current.disconnect();
        stream.getTracks().forEach((t) => t.stop());
        ctx.close();
        streamRef.current = null;
        ctxRef.current = null;
        processorRef.current = null;

        setStatus('stopped');
        const blob = encodeWav(pcm, sampleRate);
        const url = URL.createObjectURL(blob);
        setMediaBlobUrl(url);
        onStopRef.current && onStopRef.current(url, blob);
    }, []);

    // 组件卸载时释放麦克风
    useEffect(() => {
        return () => {
            if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
            if (ctxRef.current) ctxRef.current.close();
        };
    }, []);

    return { status, startRecording, stopRecording, mediaBlobUrl, error };
}
