import React from 'react';

const ImagenPage = () => {
  return (
    <div>
      <a href="/historial">Historial</a>
      <div className="min-h-screen flex items-center justify-center p-4">
        <img
          src="/gato.png" // Ruta de tu imagen
          alt="Imagen descriptiva"
        />
        <h1>Perdona lo poquito y lo mal acomodado</h1>
      </div>
    </div>
  );
};

export default ImagenPage;