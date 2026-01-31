import { useRef } from "react";
import { QrCode, ShieldCheck, Edit3, Download } from "lucide-react";

const StyledQRCard = ({ title, subtitle, mode, petName, children }) => {
  const isReadOnly = mode === "READ_ONLY";
  const qrContainerRef = useRef(null);

  const handleDownload = () => {
    if (!qrContainerRef.current) return;

    const canvas = qrContainerRef.current.querySelector("canvas");
    if (canvas) {
      const link = document.createElement("a");
      link.download = `QR-${petName}-${mode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      return;
    }

    const svg = qrContainerRef.current.querySelector("svg");
    if (svg) {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);

      const svgBlob = new Blob([svgStr], {
        type: "image/svg+xml;charset=utf-8",
      });

      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const link = document.createElement("a");
        link.download = `QR-${petName}-${mode}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        URL.revokeObjectURL(url);
      };

      img.src = url;
    }
  };

  return (
    <div className="relative w-full max-w-xs mx-auto">

      {/* Glow */}
      <div
        className={`absolute -inset-1 rounded-3xl blur-xl opacity-30
        ${
          isReadOnly
            ? "bg-gradient-to-r from-blue-400 to-cyan-400"
            : "bg-gradient-to-r from-green-400 to-emerald-400"
        }`}
      />

      <div className="relative bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">

        {/* Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between
          ${
            isReadOnly
              ? "bg-gradient-to-r from-blue-600 to-cyan-600"
              : "bg-gradient-to-r from-green-600 to-emerald-600"
          }`}
        >
          <div className="flex items-center gap-2 text-white">
            {isReadOnly ? <ShieldCheck size={18} /> : <Edit3 size={18} />}
            <p className="font-semibold text-sm">
              {isReadOnly ? "Solo lectura" : "Acceso de escritura"}
            </p>
          </div>

          <QrCode className="text-white opacity-80" size={18} />
        </div>

        {/* Body */}
        <div className="px-6 py-6 text-center">

          <h4 className="font-bold text-gray-900 text-lg">
            {title}
          </h4>

          <p className="text-sm text-gray-500 mb-4">
            {subtitle}
          </p>

          {/* QR */}
          <div
            ref={qrContainerRef}
            className="relative inline-flex p-3 rounded-2xl bg-white shadow-lg border"
          >
            {children}
          </div>

          {/* BOTÓN DESCARGAR */}
          <button
            onClick={handleDownload}
            className={`mt-4 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition
              ${
                isReadOnly
                  ? "border-blue-200 text-blue-700 hover:bg-blue-50"
                  : "border-green-200 text-green-700 hover:bg-green-50"
              }
            `}
          >
            <Download size={16} />
            Descargar QR
          </button>

          {/* Footer */}
          <div className="mt-4 text-xs text-gray-500">
            Mascota:
            <span className="font-semibold text-gray-700 ml-1">
              {petName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyledQRCard;
