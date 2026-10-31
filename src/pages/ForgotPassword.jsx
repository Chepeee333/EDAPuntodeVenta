// Importaciones: React y el hook useState para manejar el estado del componente
import React, { useState } from "react";
// Link permite navegar a otra página sin recargar el sitio
import { Link } from "react-router-dom";
// Cliente de Base44: se usa para comunicarse con el servicio de autenticación
import { base44 } from "@/api/base44Client";
// Componentes de interfaz reutilizables (botón, campo de texto y etiqueta)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Íconos: sobre, flecha hacia atrás e ícono de carga
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
// Plantilla visual compartida por las pantallas de autenticación (login, registro, etc.)
import AuthLayout from "@/components/AuthLayout";

// Pantalla "Olvidé mi contraseña": el usuario escribe su correo y se le envía un enlace
export default function ForgotPassword() {
  // Guarda el correo que el usuario escribe en el campo
  const [email, setEmail] = useState("");
  // Indica si la solicitud se está enviando (para mostrar el ícono de carga)
  const [loading, setLoading] = useState(false);
  // Indica si ya se envió la solicitud (para mostrar el mensaje de confirmación)
  const [sent, setSent] = useState(false);

  // Se ejecuta cuando el usuario envía el formulario
  const handleSubmit = async (e) => {
    // Evita que la página se recargue al enviar el formulario
    e.preventDefault();
    // Activa el estado de carga
    setLoading(true);
    try {
      // Pide a Base44 que envíe el correo para restablecer la contraseña
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Siempre se muestra el mensaje de éxito, aunque haya error.
      // Así no se revela si un correo existe o no en el sistema (por seguridad).
    } finally {
      // Pase lo que pase, se quita la carga y se muestra la confirmación
      setLoading(false);
      setSent(true);
    }
  };

  return (
    // Estructura visual de la pantalla, con ícono, título, subtítulo y pie de página
    <AuthLayout
      icon={Mail}
      title="Restablecer contraseña"
      subtitle="Te enviaremos un enlace para restablecerla"
      footer={
        // Enlace para regresar a la pantalla de inicio de sesión
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Volver a iniciar sesión
        </Link>
      }
    >
      {/* Si ya se envió la solicitud, se muestra solo el mensaje de confirmación */}
      {sent ? (
        <p className="text-sm text-foreground text-center">
          Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña en breve.
        </p>
      ) : (
        // Si aún no se envía, se muestra el formulario
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              {/* Ícono de sobre dentro del campo (decorativo) */}
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="tu@ejemplo.com"
                value={email}
                // Cada vez que el usuario escribe, se actualiza el estado del correo
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                // El campo es obligatorio: no deja enviar el formulario vacío
                required
              />
            </div>
          </div>
          {/* Botón de envío: se desactiva mientras se procesa la solicitud */}
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                {/* Ícono giratorio mientras se envía */}
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar enlace"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
