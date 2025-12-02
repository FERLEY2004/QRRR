// QR Generator Utility
import qr from 'qr-image';

export const generateQRCode = async (data) => {
  try {
    // Generar QR como buffer
    const qrBuffer = qr.imageSync(data, { type: 'png', size: 10 });
    const base64 = qrBuffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Error en generateQRCode:', error);
    throw new Error('Error al generar código QR');
  }
};

export default { generateQRCode };
