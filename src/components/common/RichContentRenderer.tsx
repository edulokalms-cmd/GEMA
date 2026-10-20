import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Paperclip,
  Download,
  ExternalLink,
  ZoomIn,
  X,
  Copy,
  Check,
  Lightbulb,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface RichContentRendererProps {
  content: string;
  className?: string;
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  className = '',
}) => {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  if (!content || !content.trim()) {
    return (
      <div className="p-6 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        (Belum ada konten materi yang dituliskan)
      </div>
    );
  }

  // Parse lines into blocks
  const lines = content.split('\n');
  const blocks: Array<{
    type: 'heading' | 'image' | 'file' | 'quote' | 'code' | 'list' | 'table' | 'divider' | 'paragraph';
    level?: number;
    text?: string;
    items?: string[];
    url?: string;
    alt?: string;
    size?: string;
    language?: string;
    rows?: string[][];
    quoteType?: 'tip' | 'warning' | 'info' | 'normal';
  }> = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check for empty lines
    if (!line) {
      i++;
      continue;
    }

    // Check for horizontal divider
    if (line === '---' || line === '***' || line === '___') {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // Check for Code block ```
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: 'code',
        text: codeLines.join('\n'),
        language: language || 'text',
      });
      continue;
    }

    // Check for Standalone Image: ![Alt text](url) or [image: url | alt]
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      blocks.push({
        type: 'image',
        alt: imgMatch[1] || 'Gambar Materi',
        url: imgMatch[2],
      });
      i++;
      continue;
    }

    const customImgMatch = line.match(/^\[image:\s*([^|\]]+)(?:\|\s*([^\]]+))?\]$/i);
    if (customImgMatch) {
      blocks.push({
        type: 'image',
        url: customImgMatch[1].trim(),
        alt: (customImgMatch[2] || 'Gambar Materi').trim(),
      });
      i++;
      continue;
    }

    // Check for Standalone File Link: 📎 [Title](url) or [file: filename | size](url)
    const fileCardMatch = line.match(/^(?:📎\s*)?\[(?:Unduh Dokumen|File|Dokumen):\s*([^\]]+)\]\(([^)]+)\)$/i);
    if (fileCardMatch) {
      blocks.push({
        type: 'file',
        alt: fileCardMatch[1],
        url: fileCardMatch[2],
        size: 'Dokumen Perkuliahan',
      });
      i++;
      continue;
    }

    const customFileMatch = line.match(/^\[file:\s*([^|\]]+)(?:\|\s*([^\]]+))?\]\(([^)]+)\)$/i);
    if (customFileMatch) {
      blocks.push({
        type: 'file',
        alt: customFileMatch[1].trim(),
        size: (customFileMatch[2] || 'Dokumen Perkuliahan').trim(),
        url: customFileMatch[3].trim(),
      });
      i++;
      continue;
    }

    // Check for Headings: #, ##, ###, ####
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // Check for Callout / Quote: > ...
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      let quoteType: 'tip' | 'warning' | 'info' | 'normal' = 'normal';

      while (i < lines.length && lines[i].trim().startsWith('>')) {
        let contentPart = lines[i].trim().replace(/^>\s?/, '');
        if (contentPart.toLowerCase().includes('tip') || contentPart.includes('💡')) {
          quoteType = 'tip';
        } else if (contentPart.toLowerCase().includes('perhatian') || contentPart.toLowerCase().includes('warning') || contentPart.includes('⚠️')) {
          quoteType = 'warning';
        } else if (contentPart.toLowerCase().includes('catatan') || contentPart.toLowerCase().includes('info') || contentPart.includes('ℹ️')) {
          quoteType = 'info';
        }
        quoteLines.push(contentPart);
        i++;
      }
      blocks.push({
        type: 'quote',
        text: quoteLines.join('\n'),
        quoteType,
      });
      continue;
    }

    // Check for Unordered List: - or *
    if (line.match(/^[-*]\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s+/)) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'list',
        items: listItems,
      });
      continue;
    }

    // Check for Ordered List: 1. 2. 3.
    if (line.match(/^\d+\.\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'list',
        items: listItems,
      });
      continue;
    }

    // Check for Markdown Table: starts with |
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      // Parse table rows
      const rows = tableLines
        .filter((tl) => !tl.replace(/\|/g, '').trim().match(/^[-:\s]+$/)) // filter out divider |---|---|
        .map((tl) =>
          tl
            .slice(1, -1)
            .split('|')
            .map((cell) => cell.trim())
        );

      if (rows.length > 0) {
        blocks.push({
          type: 'table',
          rows,
        });
        continue;
      }
    }

    // Regular paragraph (or paragraph containing inline image or link)
    // If paragraph has inline markdown image: ![alt](url) embedded within text
    if (line.includes('![') && line.includes('](')) {
      // Split paragraph around the image to render cleanly
      const parts = line.split(/(!\[[^\]]*\]\([^)]+\))/g);
      for (const part of parts) {
        const singleImgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (singleImgMatch) {
          blocks.push({
            type: 'image',
            alt: singleImgMatch[1] || 'Gambar Materi',
            url: singleImgMatch[2],
          });
        } else if (part.trim()) {
          blocks.push({
            type: 'paragraph',
            text: part.trim(),
          });
        }
      }
      i++;
      continue;
    }

    blocks.push({
      type: 'paragraph',
      text: line,
    });
    i++;
  }

  // Helper to parse inline bold, italic, code, and links
  const renderInlineFormatted = (text: string): React.ReactNode => {
    // Check for links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const tokens: Array<{ type: 'text' | 'link'; content: string; url?: string }> = [];
    let lastIdx = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        tokens.push({ type: 'text', content: text.substring(lastIdx, match.index) });
      }
      tokens.push({
        type: 'link',
        content: match[1],
        url: match[2],
      });
      lastIdx = linkRegex.lastIndex;
    }
    if (lastIdx < text.length) {
      tokens.push({ type: 'text', content: text.substring(lastIdx) });
    }

    return (
      <>
        {tokens.map((token, idx) => {
          if (token.type === 'link' && token.url) {
            const isFileLink =
              token.content.toLowerCase().includes('unduh') ||
              token.content.toLowerCase().includes('download') ||
              token.content.toLowerCase().includes('file') ||
              token.content.toLowerCase().includes('dokumen') ||
              token.url.includes('.pdf') ||
              token.url.includes('.doc') ||
              token.url.includes('.ppt') ||
              token.url.includes('.xls');

            return (
              <a
                key={idx}
                href={token.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 font-bold underline transition-colors cursor-pointer ${
                  isFileLink
                    ? 'text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-200'
                    : 'text-indigo-600 hover:text-indigo-800'
                }`}
                onClick={(e) => {
                  if (token.url?.startsWith('data:')) {
                    e.preventDefault();
                    const a = document.createElement('a');
                    a.href = token.url;
                    a.download = token.content || 'lampiran_materi';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }}
              >
                {isFileLink ? <Paperclip className="w-3.5 h-3.5 inline shrink-0" /> : null}
                <span>{token.content}</span>
                {!isFileLink && <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-70" />}
              </a>
            );
          }

          // Format bold, italic, code inside text token
          return formatTextPart(token.content, idx);
        })}
      </>
    );
  };

  const formatTextPart = (part: string, parentKey: number | string): React.ReactNode => {
    // Parse inline code `code`
    const codeParts = part.split(/(`[^`]+`)/g);
    return (
      <span key={parentKey}>
        {codeParts.map((cp, cIdx) => {
          if (cp.startsWith('`') && cp.endsWith('`') && cp.length > 2) {
            return (
              <code
                key={cIdx}
                className="px-1.5 py-0.5 bg-slate-100 text-pink-600 font-mono text-xs rounded border border-slate-200/80 mx-0.5"
              >
                {cp.slice(1, -1)}
              </code>
            );
          }

          // Parse bold **text**
          const boldParts = cp.split(/(\*\*[^*]+\*\*)/g);
          return boldParts.map((bp, bIdx) => {
            if (bp.startsWith('**') && bp.endsWith('**') && bp.length > 4) {
              const innerText = bp.slice(2, -2);
              return (
                <strong key={`${cIdx}-${bIdx}`} className="font-bold text-slate-900">
                  {innerText}
                </strong>
              );
            }

            // Parse italic *text*
            const italicParts = bp.split(/(\*[^*]+\*)/g);
            return italicParts.map((ip, iIdx) => {
              if (ip.startsWith('*') && ip.endsWith('*') && ip.length > 2) {
                return (
                  <em key={`${cIdx}-${bIdx}-${iIdx}`} className="italic text-slate-700">
                    {ip.slice(1, -1)}
                  </em>
                );
              }
              return ip;
            });
          });
        })}
      </span>
    );
  };

  const getFileIcon = (filename: string, url: string) => {
    const lower = (filename + url).toLowerCase();
    if (lower.includes('.pdf')) {
      return <FileText className="w-5 h-5 text-rose-600" />;
    }
    if (lower.includes('.ppt') || lower.includes('.presentation')) {
      return <FileText className="w-5 h-5 text-amber-600" />;
    }
    if (lower.includes('.xls') || lower.includes('.csv') || lower.includes('sheet')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (lower.includes('.jpg') || lower.includes('.png') || lower.includes('.image')) {
      return <ImageIcon className="w-5 h-5 text-purple-600" />;
    }
    return <Paperclip className="w-5 h-5 text-indigo-600" />;
  };

  const handleDownload = (url: string, name: string) => {
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`space-y-4 text-slate-800 ${className}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 1) {
              return (
                <h1
                  key={index}
                  className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-3 pb-1 border-b border-slate-200"
                >
                  {renderInlineFormatted(block.text || '')}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2
                  key={index}
                  className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight pt-4 pb-1 border-l-4 border-indigo-600 pl-3 bg-indigo-50/40 rounded-r-xl"
                >
                  {renderInlineFormatted(block.text || '')}
                </h2>
              );
            }
            if (block.level === 3) {
              return (
                <h3
                  key={index}
                  className="text-sm sm:text-base font-bold text-slate-800 pt-2 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span>{renderInlineFormatted(block.text || '')}</span>
                </h3>
              );
            }
            return (
              <h4 key={index} className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider pt-1">
                {renderInlineFormatted(block.text || '')}
              </h4>
            );
          }

          case 'image': {
            const isDataUrl = block.url?.startsWith('data:image/');
            return (
              <figure
                key={index}
                className="my-4 p-2 sm:p-3 bg-slate-50 border border-slate-200/90 rounded-2xl shadow-2xs group hover:border-indigo-300 transition-all"
              >
                <div className="relative rounded-xl overflow-hidden bg-slate-900/5 max-h-[460px] flex items-center justify-center">
                  <img
                    src={block.url}
                    alt={block.alt || 'Gambar Materi'}
                    className="max-h-[440px] w-auto max-w-full object-contain mx-auto rounded-lg transition-transform group-hover:scale-[1.01]"
                    loading="lazy"
                  />
                  {/* Floating Action Buttons */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setLightboxImage({ url: block.url!, alt: block.alt || 'Gambar Materi' })}
                      className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                      title="Perbesar Tampilan Gambar"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Perbesar</span>
                    </button>
                    {!isDataUrl && (
                      <a
                        href={block.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-lg backdrop-blur-xs shadow-md cursor-pointer transition-colors"
                        title="Buka Gambar di Tab Baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
                {block.alt && (
                  <figcaption className="mt-2 text-center text-xs font-medium text-slate-600 px-2 flex items-center justify-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{block.alt}</span>
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'file': {
            const fileName = block.alt || 'Dokumen Materi Perkuliahan';
            return (
              <div
                key={index}
                className="my-3 p-3.5 sm:p-4 bg-gradient-to-r from-indigo-50/60 to-slate-50 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-indigo-100 shrink-0">
                    {getFileIcon(fileName, block.url || '')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {fileName}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-bold text-indigo-600 uppercase">Berkas Perkuliahan</span>
                      <span>•</span>
                      <span>{block.size || 'Dapat Diunduh / Dibuka'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownload(block.url || '', fileName)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh File</span>
                  </button>
                  {!block.url?.startsWith('data:') && (
                    <a
                      href={block.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Buka di tab baru"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          }

          case 'quote': {
            let quoteStyle = 'bg-slate-50 border-slate-300 text-slate-700';
            let icon = <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />;

            if (block.quoteType === 'tip') {
              quoteStyle = 'bg-amber-50/70 border-amber-400 text-amber-900';
              icon = <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
            } else if (block.quoteType === 'warning') {
              quoteStyle = 'bg-rose-50/70 border-rose-400 text-rose-900';
              icon = <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
            } else if (block.quoteType === 'info') {
              quoteStyle = 'bg-indigo-50/70 border-indigo-400 text-indigo-900';
              icon = <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />;
            }

            return (
              <div
                key={index}
                className={`p-4 rounded-2xl border-l-4 shadow-2xs space-y-1.5 my-3 ${quoteStyle}`}
              >
                <div className="flex items-start gap-2.5">
                  {icon}
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line flex-1">
                    {renderInlineFormatted(block.text || '')}
                  </div>
                </div>
              </div>
            );
          }

          case 'list': {
            return (
              <ul key={index} className="space-y-1.5 pl-2 sm:pl-4 my-2 text-xs sm:text-sm">
                {block.items?.map((item, lIdx) => (
                  <li key={lIdx} className="flex items-start gap-2.5 text-slate-700 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-2" />
                    <span className="flex-1">{renderInlineFormatted(item)}</span>
                  </li>
                ))}
              </ul>
            );
          }

          case 'table': {
            if (!block.rows || block.rows.length === 0) return null;
            const headers = block.rows[0];
            const dataRows = block.rows.slice(1);
            return (
              <div key={index} className="overflow-x-auto my-3 rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200">
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3.5 py-2.5 font-bold text-slate-800">
                          {renderInlineFormatted(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {dataRows.map((r, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                        {r.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3.5 py-2 text-slate-700">
                            {renderInlineFormatted(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case 'code': {
            return (
              <div key={index} className="my-3 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
                <div className="px-4 py-2 bg-slate-950 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800">
                  <span className="font-mono uppercase font-bold text-[11px] text-slate-300">
                    {block.language || 'code'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(block.text || '');
                      setCopiedCodeIndex(index);
                      setTimeout(() => setCopiedCodeIndex(null), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedCodeIndex === index ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-emerald-400 leading-relaxed">
                  <code>{block.text}</code>
                </pre>
              </div>
            );
          }

          case 'divider': {
            return <hr key={index} className="my-6 border-slate-200" />;
          }

          case 'paragraph':
          default: {
            return (
              <p key={index} className="text-xs sm:text-sm leading-relaxed text-slate-800">
                {renderInlineFormatted(block.text || '')}
              </p>
            );
          }
        }
      })}

      {/* Lightbox Modal for Fullscreen Image Viewing */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] bg-slate-900 rounded-3xl p-3 shadow-2xl border border-slate-800 flex flex-col items-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between px-3 py-2 border-b border-slate-800 text-white mb-2">
              <span className="text-xs sm:text-sm font-bold truncate flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                {lightboxImage.alt}
              </span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.alt}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="w-full flex items-center justify-between px-3 py-2 border-t border-slate-800 text-xs text-slate-400">
              <span>Klik tombol tutup atau latar belakang untuk kembali.</span>
              <button
                type="button"
                onClick={() => handleDownload(lightboxImage.url, lightboxImage.alt + '.png')}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Gambar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
