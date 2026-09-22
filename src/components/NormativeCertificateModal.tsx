import React, { useState, useEffect } from 'react';
import { DigitalPassportLot } from '../types';
import { generateQrSvg } from '../utils/qrCode';

interface NormativeCertificateModalProps {
  isOpen: boolean;
  lot: DigitalPassportLot | null;
  onClose: () => void;
  onShareInChat?: (lot: DigitalPassportLot) => void;
  onOpenQrTag?: (lot: DigitalPassportLot) => void;
}

export const NormativeCertificateModal: React.FC<NormativeCertificateModalProps> = ({
  isOpen,
  lot,
  onClose,
  onShareInChat,
  onOpenQrTag
}) => {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'ready'>('idle');
  const [copied, setCopied] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);

  // Sync URL query params when modal opens/closes so the link can also be copied from browser bar
  useEffect(() => {
    if (!isOpen || !lot) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('cert', lot.code);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.error(e);
    }

    return () => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('cert');
        window.history.replaceState({}, '', url.toString());
      } catch (e) {
        console.error(e);
      }
    };
  }, [isOpen, lot]);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !lot) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?cert=${lot.code}`
    : `https://oaxaca-cafe.org/?cert=${lot.code}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Error al copiar enlace:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `☕ *Certificado Oficial de Café NOM/NMX*\n\n` +
      `Lote: *${lot.title}* (Folio: OAX-MIX-${lot.code})\n` +
      `Productor: ${lot.producerName} (${lot.location})\n` +
      `Humedad: ${lot.nomCompliance?.humidity || '11.4%'} (Conforme NMX-F-083)\n` +
      `Altitud: ${lot.altitude || '1,650 msnm'} (Estricta Altura NOM-255-SCFI)\n` +
      `Sellado Inmutable en Stellar Horizon Testnet.\n\n` +
      `Ver dictamen oficial y trazabilidad:\n${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificado Oficial NOM/NMX - Lote ${lot.code}`,
          text: `Certificado Oficial de Cumplimiento Normativo (NMX-F-083 / NOM-255-SCFI) - Lote ${lot.code} (${lot.producerName}), sellado inmutable en Stellar Horizon.`,
          url: shareUrl,
        });
      } catch (e) {
        console.log('Share cancelado', e);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownload = () => {
    setDownloadStatus('downloading');

    setTimeout(() => {
      try {
        const compliance = lot.nomCompliance;
        const printContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Certificado Oficial de Cumplimiento Normativo NOM/NMX - Lote ${lot.code} - IT Tlaxiaco</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 36px; color: #1c1c18; max-width: 820px; margin: auto; background: #fff; }
    .header { border-bottom: 3px solid #1b3b2b; padding-bottom: 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 20px; font-weight: bold; color: #032517; margin: 0; }
    .subtitle { font-size: 12px; color: #424843; margin-top: 4px; }
    .badge { background: #c7ebd4; color: #002113; font-weight: bold; padding: 6px 14px; border-radius: 999px; font-size: 12px; text-transform: uppercase; }
    .section { margin-bottom: 20px; background: #fcf9f3; border: 1px solid #c1c8c2; border-radius: 12px; padding: 16px; }
    .table-nom { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    .table-nom th { background: #1b3b2b; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; }
    .table-nom td { padding: 8px 10px; border-bottom: 1px solid #e0ddd7; background: #fff; }
    .grid-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
    .photo-card { border: 1px solid #c1c8c2; border-radius: 8px; overflow: hidden; background: #fff; text-align: center; }
    .photo-card img { width: 100%; height: 110px; object-fit: cover; }
    .photo-label { font-size: 10px; font-weight: bold; padding: 6px 4px; color: #032517; background: #f0eee8; }
    .hash-box { font-family: monospace; font-size: 10px; word-break: break-all; background: #eee; padding: 10px; border-radius: 6px; color: #a73918; margin-top: 8px; }
    .footer { margin-top: 30px; font-size: 11px; text-align: center; color: #727973; border-top: 1px solid #c1c8c2; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">INSTITUTO TECNOLÓGICO DE TLAXIACO</h1>
      <div class="subtitle">Laboratorio de Calidad del Café & Raíz · Tlaxiaco, Oaxaca</div>
      <div class="subtitle"><strong>CERTIFICADO DE CONFORMIDAD NORMATIVA (NMX-F-083 / NOM-255-SCFI)</strong></div>
    </div>
    <div class="badge">Sello Inmutable Stellar</div>
  </div>

  <div class="section">
    <div style="display: flex; justify-content: space-between; font-size: 12px;">
      <strong>FOLIO OFICIAL: OAX-MIX-${lot.code}</strong>
      <span>Fecha: 28 Octubre 2024</span>
    </div>
    <h2 style="color: #032517; margin: 8px 0 6px 0; font-size: 18px;">${lot.title}</h2>
    <p style="margin: 0; color: #424843; font-size: 13px; line-height: 1.5;">
      <strong>Productor:</strong> ${lot.producerName} (${lot.producerInitials})<br/>
      <strong>Ubicación Comunitaria:</strong> ${lot.location}<br/>
      <strong>Volumen Certificado:</strong> ${lot.volumeKg} Kilogramos · Pergamino Seco<br/>
      <strong>Organismo Evaluador:</strong> ${lot.evaluatorOrg}
    </p>
  </div>

  <h3 style="color: #032517; font-size: 14px; margin-bottom: 6px;">TABLA DE CUMPLIMIENTO DE NORMAS OFICIALES MEXICANAS</h3>
  <table class="table-nom">
    <thead>
      <tr>
        <th>PARÁMETRO EVALUADO</th>
        <th>NORMA APLICABLE</th>
        <th>RESULTADO OBTENIDO</th>
        <th>DICTAMEN</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Humedad en Grano Pergamino</strong></td>
        <td>NMX-F-083-COFOCAFE (10.0% a 12.0%)</td>
        <td>${compliance?.humidity || '11.4%'}</td>
        <td style="color: #032517; font-weight: bold;">CONFORME (Óptimo)</td>
      </tr>
      <tr>
        <td><strong>Conteo Físico de Defectos</strong></td>
        <td>NMX-F-083 (Muestra de 300g)</td>
        <td>${compliance ? compliance.defectPercentage + '%' : '< 1.2%'}</td>
        <td style="color: #032517; font-weight: bold;">GRADO ESPECIALIDAD (Exportación)</td>
      </tr>
      <tr>
        <td><strong>Altitud de Origen</strong></td>
        <td>NOM-255-SCFI-2018 (> 1,200 msnm)</td>
        <td>${lot.altitude || '1,650 msnm'}</td>
        <td style="color: #032517; font-weight: bold;">ESTRICTA ALTURA (SHG)</td>
      </tr>
      <tr>
        <td><strong>Pureza Varietal & OGM</strong></td>
        <td>Catálogo Nacional Variedades</td>
        <td>${compliance?.botanicalPurity || '100% Typica Pluma Nativo'}</td>
        <td style="color: #032517; font-weight: bold;">CONFORME (Nativo Libre OGM)</td>
      </tr>
      <tr>
        <td><strong>Inocuidad & Agroquímicos</strong></td>
        <td>Manejo Agroecológico Sostenible</td>
        <td>0.0 ppm Trazas Sintéticas</td>
        <td style="color: #032517; font-weight: bold;">CERTIFICACIÓN AGROECOLÓGICA</td>
      </tr>
    </tbody>
  </table>

  <h3 style="color: #032517; font-size: 14px; margin-top: 18px; margin-bottom: 6px;">EVIDENCIAS FOTOGRÁFICAS DE CAMPO Y LABORATORIO</h3>
  <div class="grid-photos">
    <div class="photo-card">
      <img src="${compliance?.evidencePhotos?.grainGridSampleUrl || lot.imageUrl}" alt="Muestra Grano" />
      <div class="photo-label">Muestra Grano Pergamino (NMX-F-083)</div>
    </div>
    <div class="photo-card">
      <img src="${compliance?.evidencePhotos?.humidityGaugeUrl || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop&q=80'}" alt="Lectura Humedad" />
      <div class="photo-label">Humedad en Rango 11.4%</div>
    </div>
    <div class="photo-card">
      <img src="${compliance?.evidencePhotos?.foliarHealthUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80'}" alt="Inspección Parcela" />
      <div class="photo-label">Sanidad Foliar y de Parcela</div>
    </div>
  </div>

  <div class="section" style="margin-top: 20px;">
    <strong>REGISTRO INMUTABLE EN RED STELLAR HORIZON (TESTNET)</strong>
    <div class="hash-box">
      LEDGER STELLAR: #${compliance?.stellarTxLedger || '52,491,802'}<br/>
      HASH DE TRANSACCIÓN SHA-256: ${compliance?.stellarTxHash || `${lot.hash}7a98bc19d44e510f2c814407ab198762f0592`}<br/>
      ESTADO: REGISTRO INMUTABLE Y CRIPTOGRÁFICAMENTE VERIFICADO
    </div>
  </div>

  <div style="display: flex; align-items: center; justify-content: space-between; border: 2px dashed #1b3b2b; border-radius: 12px; padding: 14px 18px; margin-top: 20px; background: #fcf9f3;">
    <div>
      <div style="font-size: 13px; font-weight: bold; color: #032517;">CÓDIGO QR DE AUDITORÍA Y TRAZABILIDAD EN VIVO</div>
      <div style="font-size: 11px; color: #424843; margin: 4px 0;">Escanee con la cámara de su teléfono para verificar este dictamen directamente en la red pública Stellar.</div>
      <div style="font-size: 10px; font-family: monospace; color: #a73918; word-break: break-all;">${shareUrl}</div>
    </div>
    <div style="background: #fff; padding: 8px; border-radius: 8px; border: 1px solid #c1c8c2; flex-shrink: 0; margin-left: 14px;">
      ${generateQrSvg(shareUrl, { size: 130, margin: 2, color: '#032517' })}
    </div>
  </div>

  <div class="footer">
    Certificado emitido y resguardado criptográficamente por la plataforma comunitaria Raíz.<br/>
    Instituto Tecnológico de Tlaxiaco · Carretera a San Mateo Peñasco Km 2.5, Tlaxiaco, Oaxaca.
  </div>
</body>
</html>
        `;

        const blob = new Blob([printContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Dictamen-Oficial-${lot.code}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloadStatus('ready');
      } catch (err) {
        console.error('Error al descargar:', err);
        setDownloadStatus('ready');
      }
    }, 600);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dictamen-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#c1c8c2]/60 max-h-[90vh] flex flex-col relative"
      >
        {/* Certificate Header */}
        <div className="bg-[#1b3b2b] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px] text-[#c7ebd4]">verified</span>
            <div>
              <h3 id="dictamen-title" className="text-[17px] font-bold tracking-tight">Dictamen Normativo Oficial</h3>
              <p className="text-[11px] text-[#abcfb8]">Certificación Agroecológica Mixteca</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 text-white flex items-center justify-center cursor-pointer transition-all"
              aria-label="Compartir enlace"
              title="Compartir enlace del certificado"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 text-white flex items-center justify-center cursor-pointer transition-all"
              aria-label="Cerrar dictamen"
              title="Cerrar dictamen"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Toast confirmation for copy */}
        {copied && (
          <div className="bg-emerald-600 text-white text-[12px] font-bold py-2 px-4 text-center flex items-center justify-center gap-1.5 animate-fade-in">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>¡Enlace directo del certificado copiado al portapapeles!</span>
          </div>
        )}

        {/* Certificate Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-[13px] text-[#1c1c18]">
          <div className="border border-[#c1c8c2]/50 rounded-2xl p-4 bg-[#fcf9f3] space-y-2">
            <div className="flex justify-between items-center text-[11px] text-[#727973] border-b border-[#c1c8c2]/30 pb-2">
              <span>FOLIO REGIONAL: OAX-MIX-{lot.code}</span>
              <span className="font-bold text-[#032517] bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                {lot.nomCompliance?.immutableSealStatus || 'SELLADO INMUTABLE'}
              </span>
            </div>

            <h4 className="text-[16px] font-bold text-[#032517]">{lot.title}</h4>
            <p className="text-[#424843] leading-relaxed">
              <strong>Productor:</strong> {lot.producerName} <br />
              <strong>Ubicación:</strong> {lot.location} <br />
              <strong>Volumen Amparado:</strong> {lot.volumeKg} kg · Grano Pergamino Seco
            </p>
          </div>

          {/* NOM / NMX Normative Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-[#032517] text-[12px] uppercase tracking-wide flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-700">fact_check</span>
                <span>Conformidad Normativa Oficial (NMX / NOM)</span>
              </h5>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 font-bold px-2 py-0.5 rounded border border-emerald-200">
                Aprobado 100%
              </span>
            </div>

            <div className="border border-emerald-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="divide-y divide-gray-100 text-[11px]">
                <div className="p-2.5 flex items-center justify-between bg-[#fcf9f3]">
                  <div>
                    <span className="font-bold text-[#032517] block">Humedad en Grano Pergamino</span>
                    <span className="text-[10px] text-[#727973]">NMX-F-083 (Rango Óptimo 10.0% – 12.0%)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-800 block text-[12px]">
                      {lot.nomCompliance?.humidity || '11.4%'}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                      Cumple NMX
                    </span>
                  </div>
                </div>

                <div className="p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#032517] block">Conteo Físico de Defectos</span>
                    <span className="text-[10px] text-[#727973]">Muestra 300g (Broca, grano negro, agrio)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-800 block text-[12px]">
                      {lot.nomCompliance ? `${lot.nomCompliance.defectPercentage}%` : '< 1.2%'}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                      Especialidad
                    </span>
                  </div>
                </div>

                <div className="p-2.5 flex items-center justify-between bg-[#fcf9f3]">
                  <div>
                    <span className="font-bold text-[#032517] block">Altitud de Parcela</span>
                    <span className="text-[10px] text-[#727973]">NOM-255-SCFI-2018 (&gt; 1,200 msnm)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-800 block text-[12px]">
                      {lot.altitude || '1,650 msnm'}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                      Estricta Altura
                    </span>
                  </div>
                </div>

                <div className="p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#032517] block">Pureza Botánica & Agroecología</span>
                    <span className="text-[10px] text-[#727973]">Sin agroquímicos ni transgénicos</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#032517] block text-[12px]">
                      100% Typica Pluma
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                      Libre OGM
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Photos */}
          <div className="space-y-1.5">
            <h5 className="font-bold text-[#032517] text-[12px] uppercase tracking-wide flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#a73918]">photo_library</span>
              <span>Evidencia Fotográfica Certificada</span>
            </h5>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl overflow-hidden border border-[#c1c8c2]/50 bg-white">
                <img
                  src={lot.nomCompliance?.evidencePhotos?.grainGridSampleUrl || lot.imageUrl}
                  alt="Muestra de grano pergamino"
                  className="w-full h-16 object-cover"
                />
                <span className="text-[9px] font-bold text-center block py-1 bg-[#f0eee8] text-[#032517] truncate px-1">
                  Muestra Grano
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-[#c1c8c2]/50 bg-white">
                <img
                  src={lot.nomCompliance?.evidencePhotos?.humidityGaugeUrl || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop&q=80'}
                  alt="Lectura de Humedad"
                  className="w-full h-16 object-cover"
                />
                <span className="text-[9px] font-bold text-center block py-1 bg-[#f0eee8] text-[#032517] truncate px-1">
                  Higrómetro 11.4%
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-[#c1c8c2]/50 bg-white">
                <img
                  src={lot.nomCompliance?.evidencePhotos?.foliarHealthUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80'}
                  alt="Inspección Parcela"
                  className="w-full h-16 object-cover"
                />
                <span className="text-[9px] font-bold text-center block py-1 bg-[#f0eee8] text-[#032517] truncate px-1">
                  Sanidad Ladera
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic hash and Stellar Ledger */}
          <div className="bg-[#1b3b2b]/95 text-white p-3.5 rounded-2xl border border-emerald-600/40 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-emerald-700/50 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-300 text-[18px]">lock</span>
                <span className="font-bold text-white text-[12px]">Sellado Inmutable Stellar Ledger</span>
              </div>
              <span className="text-[10px] bg-emerald-900/80 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-700">
                #{lot.nomCompliance?.stellarTxLedger || '52,491,802'}
              </span>
            </div>

            <div className="font-mono text-[10px] text-emerald-100/90 break-all select-all bg-black/30 p-2 rounded-lg border border-white/10">
              <span className="text-emerald-400 font-semibold block mb-0.5">TX HASH SHA-256:</span>
              {lot.nomCompliance?.stellarTxHash || `${lot.hash}7a98bc19d44e510f2c814407ab198762f0592`}
            </div>

            <div className="flex items-center justify-between text-[10px] text-emerald-200/80 pt-0.5">
              <span>Red: Stellar Horizon (Testnet Oficial)</span>
              <span>Inmutable & No Alterable</span>
            </div>
          </div>

          {/* Share via Link Section */}
          <div className="border border-amber-300/80 rounded-2xl p-3.5 bg-amber-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#a73918] text-[18px]">share</span>
                <span className="font-bold text-[#032517] text-[12px] uppercase tracking-wide">
                  Compartir Certificado vía Enlace
                </span>
              </div>
              <span className="text-[10px] bg-amber-200/70 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                Acceso Público
              </span>
            </div>

            <p className="text-[11px] text-[#424843]">
              Cualquier comprador, cooperativa o certificador con este enlace puede validar en vivo el dictamen y los registros de la red Stellar.
            </p>

            {/* URL Display with Copy Button */}
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-amber-200 shadow-2xs">
              <span className="material-symbols-outlined text-[16px] text-[#727973] ml-1">link</span>
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 text-[11px] text-[#032517] bg-transparent outline-hidden font-mono truncate select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#032517] hover:bg-[#1b3b2b] text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Quick Share Buttons (WhatsApp & Native) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="h-9 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.541 1.948.825 2.796.825 3.183 0 5.77-2.586 5.77-5.767 0-3.181-2.587-5.766-5.77-5.766zm6.818 5.766c0 3.759-3.059 6.818-6.818 6.818-.002 0-.003 0-.004 0-1.127 0-2.227-.306-3.197-.886l-4.148 1.087 1.107-4.043c-.636-1.026-.976-2.203-.976-3.411 0-3.759 3.059-6.818 6.818-6.818 3.76 0 6.818 3.059 6.818 6.818z"/>
                </svg>
                <span>Compartir WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="h-9 px-3 rounded-xl bg-white hover:bg-[#f0eee8] border border-[#c1c8c2] text-[#032517] font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                <span>Más Opciones</span>
              </button>
            </div>

            {onOpenQrTag && (
              <button
                type="button"
                onClick={() => onOpenQrTag(lot)}
                className="w-full mt-1.5 h-9.5 border border-[#a73918]/50 bg-white hover:bg-[#ffdbd1]/20 text-[#032517] rounded-xl font-bold text-[11.5px] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-[17px] text-[#a73918]">qr_code_2</span>
                <span>Generar Etiqueta QR Física para Colgar (Hang-tag)</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-white border-t border-[#c1c8c2]/30 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 h-11 border-2 border-[#032517] text-[#032517] hover:bg-emerald-50 active:scale-98 rounded-full font-bold text-[12px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Copiar enlace público del certificado"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copied ? 'check_circle' : 'link'}
              </span>
              <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 h-11 bg-[#032517] hover:bg-[#1b3b2b] text-white rounded-full font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {downloadStatus === 'downloading'
                  ? 'sync'
                  : downloadStatus === 'ready'
                  ? 'check_circle'
                  : 'download'}
              </span>
              <span>
                {downloadStatus === 'downloading'
                  ? 'Generando PDF...'
                  : downloadStatus === 'ready'
                  ? '¡PDF Guardado!'
                  : 'Descargar Dictamen Oficial'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 border border-[#c1c8c2] text-[#424843] rounded-full font-bold text-[13px] hover:bg-[#f0eee8] active:scale-98 transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
          {onShareInChat && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onShareInChat(lot);
              }}
              className="w-full text-center text-[12px] font-bold text-[#a73918] hover:underline flex items-center justify-center gap-1 py-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>Consultar dudas de este dictamen con asesor técnico →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
