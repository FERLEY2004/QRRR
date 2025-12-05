// Visitors Page
import React, { useState, useRef } from 'react';
import { visitorAPI } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

// Función auxiliar para dividir texto en múltiples líneas
const wrapText = (ctx, text, maxWidth, fontSize) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

const Visitors = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    tipo_documento: 'CC',
    motivo_visita: '',
    zona_destino: '',
    contacto: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [qrData, setQrData] = useState(null);
  const qrRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(null);
    setQrData(null);

    try {
      const result = await visitorAPI.create(formData);
      setSuccess(result.message);
      setQrData({
        data: result.qrData,
        code: result.qrCode,
        expiresAt: result.expiresAt,
        nombre: result.visitor?.nombre || formData.nombre,
        motivo_visita: result.visitor?.motivo_visita || formData.motivo_visita,
        zona_destino: result.visitor?.zona_destino || formData.zona_destino,
        contacto: result.visitor?.contacto || formData.contacto
      });
      // Limpiar formulario
      setFormData({
        nombre: '',
        documento: '',
        tipo_documento: 'CC',
        motivo_visita: '',
        zona_destino: '',
        contacto: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar visitante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Registro de Visitantes</h1>
          <p className="text-gray-600">Complete el formulario para generar un código QR temporal (24 horas)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tipo_documento" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Documento *
                  </label>
                  <select
                    id="tipo_documento"
                    name="tipo_documento"
                    value={formData.tipo_documento}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="PA">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="documento" className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Documento *
                  </label>
                  <input
                    id="documento"
                    name="documento"
                    type="text"
                    inputMode="numeric"
                    value={formData.documento}
                    onChange={(e) => {
                      // Solo permitir números
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setFormData(prev => ({ ...prev, documento: value }));
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="motivo_visita" className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de Visita *
                </label>
                <textarea
                  id="motivo_visita"
                  name="motivo_visita"
                  value={formData.motivo_visita}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ej: Reunión con instructor, entrega de documentos..."
                />
              </div>

              <div>
                <label htmlFor="zona_destino" className="block text-sm font-medium text-gray-700 mb-2">
                  Zona de Destino *
                </label>
                <select
                  id="zona_destino"
                  name="zona_destino"
                  value={formData.zona_destino}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccione una zona...</option>
                  <option value="Recepción">Recepción</option>
                  <option value="Administración">Administración</option>
                  <option value="Coordinación Académica">Coordinación Académica</option>
                  <option value="Bienestar al Aprendiz">Bienestar al Aprendiz</option>
                  <option value="Biblioteca">Biblioteca</option>
                  <option value="Talleres">Talleres</option>
                  <option value="Laboratorios">Laboratorios</option>
                  <option value="Aulas de Formación">Aulas de Formación</option>
                  <option value="Cafetería">Cafetería</option>
                  <option value="Auditorio">Auditorio</option>
                  <option value="Enfermería">Enfermería</option>
                  <option value="Zona Deportiva">Zona Deportiva</option>
                  <option value="Almacén">Almacén</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>

              <div>
                <label htmlFor="contacto" className="block text-sm font-medium text-gray-700 mb-2">
                  Contacto (Teléfono/Email)
                </label>
                <input
                  id="contacto"
                  name="contacto"
                  type="text"
                  value={formData.contacto}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="3001234567 o email@ejemplo.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </>
                ) : (
                  'Registrar Visitante y Generar QR'
                )}
              </button>
            </form>
          </div>

          {/* QR Code Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Código QR Generado</h2>
            {qrData ? (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-blue-500 inline-block mb-4" ref={qrRef}>
                  <QRCodeSVG value={JSON.stringify(qrData.data)} size={256} />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Válido hasta:</strong> {new Date(qrData.expiresAt).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500">
                  Este código QR expirará en 24 horas
                </p>
                <button
                  onClick={() => {
                    // Buscar el SVG dentro del contenedor del QR
                    const qrContainer = qrRef.current;
                    if (!qrContainer) {
                      console.error('No se encontró el contenedor del QR');
                      return;
                    }
                    
                    const svgElement = qrContainer.querySelector('svg');
                    if (!svgElement) {
                      console.error('No se encontró el SVG del QR');
                      return;
                    }

                    // Obtener las dimensiones del SVG
                    const svgSize = 256; // Tamaño del QRCodeSVG
                    
                    // Clonar el SVG y asegurar que tenga las dimensiones correctas
                    const svgClone = svgElement.cloneNode(true);
                    
                    // Asegurar que el SVG tenga width y height explícitos
                    if (!svgClone.getAttribute('width')) {
                      svgClone.setAttribute('width', svgSize);
                    }
                    if (!svgClone.getAttribute('height')) {
                      svgClone.setAttribute('height', svgSize);
                    }
                    if (!svgClone.getAttribute('viewBox')) {
                      svgClone.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`);
                    }
                    
                    // Asegurar que el SVG tenga fondo blanco
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('width', svgSize);
                    rect.setAttribute('height', svgSize);
                    rect.setAttribute('fill', 'white');
                    svgClone.insertBefore(rect, svgClone.firstChild);
                    
                    // Serializar SVG
                    const svgData = new XMLSerializer().serializeToString(svgClone);
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const svgUrl = URL.createObjectURL(svgBlob);
                    const img = new Image();
                    
                    img.onload = () => {
                      // Crear canvas más grande para incluir texto
                      const qrSize = 400; // Tamaño del QR en la imagen final
                      const padding = 40;
                      const textAreaHeight = 250; // Espacio para texto
                      const canvas = document.createElement('canvas');
                      canvas.width = qrSize + (padding * 2);
                      canvas.height = qrSize + textAreaHeight + (padding * 3);
                      
                      const ctx = canvas.getContext('2d');
                      
                      // Fondo blanco
                      ctx.fillStyle = '#ffffff';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      
                      // Dibujar QR centrado en la parte superior con mejor calidad
                      const qrX = padding;
                      const qrY = padding;
                      
                      // Mejorar la calidad del renderizado
                      ctx.imageSmoothingEnabled = true;
                      ctx.imageSmoothingQuality = 'high';
                      
                      // Dibujar el QR
                      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
                      
                      // Configurar fuente para el texto
                      const textX = canvas.width / 2;
                      let currentY = qrSize + padding * 2;
                      
                      // Estilo del texto
                      ctx.fillStyle = '#1f2937'; // Color gris oscuro
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'top';
                      
                      // Dibujar nombre
                      if (qrData.nombre) {
                        ctx.font = 'bold 18px Arial, sans-serif';
                        ctx.fillStyle = '#374151';
                        ctx.fillText('Visitante:', textX, currentY);
                        currentY += 25;
                        
                        ctx.font = '16px Arial, sans-serif';
                        ctx.fillStyle = '#1f2937';
                        ctx.fillText(qrData.nombre, textX, currentY);
                        currentY += 30;
                      }

                      // Dibujar zona de destino
                      if (qrData.zona_destino) {
                        ctx.font = 'bold 18px Arial, sans-serif';
                        ctx.fillStyle = '#374151';
                        ctx.fillText('Zona de Destino:', textX, currentY);
                        currentY += 25;
                        
                        ctx.font = '16px Arial, sans-serif';
                        ctx.fillStyle = '#2563eb';
                        ctx.fillText(qrData.zona_destino, textX, currentY);
                        currentY += 30;
                      }
                      
                      // Dibujar motivo de visita
                      if (qrData.motivo_visita) {
                        ctx.font = 'bold 18px Arial, sans-serif';
                        ctx.fillStyle = '#374151';
                        ctx.fillText('Motivo:', textX, currentY);
                        currentY += 25;
                        
                        ctx.font = '14px Arial, sans-serif';
                        ctx.fillStyle = '#4b5563';
                        // Dividir texto largo en múltiples líneas
                        const motivoLines = wrapText(ctx, qrData.motivo_visita, canvas.width - padding * 2, 14);
                        motivoLines.forEach(line => {
                          ctx.fillText(line, textX, currentY);
                          currentY += 20;
                        });
                        currentY += 10;
                      }
                      
                      // Dibujar contacto
                      if (qrData.contacto) {
                        ctx.font = 'bold 16px Arial, sans-serif';
                        ctx.fillStyle = '#374151';
                        ctx.fillText('Contacto:', textX, currentY);
                        currentY += 22;
                        
                        ctx.font = '14px Arial, sans-serif';
                        ctx.fillStyle = '#1f2937';
                        ctx.fillText(qrData.contacto, textX, currentY);
                      }
                      
                      // Descargar imagen
                      canvas.toBlob((blob) => {
                        if (!blob) {
                          console.error('Error al generar el blob de la imagen');
                          URL.revokeObjectURL(svgUrl);
                          return;
                        }
                        
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `qr-visitante-${qrData.data.documento}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        URL.revokeObjectURL(svgUrl);
                      }, 'image/png', 1.0); // Calidad máxima
                    };
                    
                    img.onerror = (error) => {
                      console.error('Error al cargar la imagen del QR:', error);
                      URL.revokeObjectURL(svgUrl);
                      alert('Error al generar la imagen del QR. Por favor, intente nuevamente.');
                    };
                    
                    img.src = svgUrl;
                  }}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Descargar QR
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <p>Complete el formulario para generar el código QR</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visitors;
