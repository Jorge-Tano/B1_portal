import React from 'react';

const ImagenPage = () => {
  return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <img
          src="/gato.png" // Ruta de tu imagen
          alt="Imagen descriptiva"
          
        />
        <h1>Perdona lo poquito y lo mal acomodado</h1>
      </div>
  );
};

export default ImagenPage;