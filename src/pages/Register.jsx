// React y el hook useState para manejar el estado del componente
import React, { useState } from "react";
// Link permite navegar a otra página sin recargar el sitio
import { Link } from "react-router-dom";
// Cliente de Base44: se comunica con el servicio de autenticación
import { base44 } from "@/api/base44Client";
// Componentes de interfaz reutilizables
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Íconos: usuario+, sobre, candado e ícono de carga
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
// Campo para ingresar el código de verificación de 6 dígitos
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
// Plantilla visual compartida por las pantallas de autenticación
import AuthLayout from "@/components/AuthLayout";
// Ícono de Google para el botón de registro con Google
import GoogleIcon from "@/components/GoogleIcon";
// Función para mostrar notificaciones emergentes
import { toast } from "@/components/ui/use-toast";

// Pantalla de registro: crea la cuenta y luego verifica el correo con un código
export default function Register() {
  // Datos que el usuario escribe en el formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Mensaje de error que se muestra en pantalla (vacío = sin error)
  const [error, setError] = useState("");
  // Indica si hay una solicitud en proceso (deshabilita botones y muestra carga)
  const [loading, setLoading] = useState(false);
  // Controla si se muestra la pantalla de código de verificación
  const [showOtp, setShowOtp] = useState(false);
  // Código de verificación que escribe el usuario
  const [otpCode, setOtpCode] = useState("");

  // Se ejecuta al enviar el formulario de registro
  const handleSubmit = async (e) => {
    // Evita que la página se recargue
    e.preventDefault();
    setError("");
    // Validación: las dos contraseñas deben coincidir
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      // Crea la cuenta en Base44
      await base44.auth.register({ email, password });
      // Si todo sale bien, pasa a la pantalla de verificación
      setShowOtp(true);
    } catch (err) {
      // Muestra el error del servidor o un mensaje por defecto
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  // Verifica el código que llegó al correo del usuario
  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      // Si el servidor devuelve un token, se guarda para mantener la sesión iniciada
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // Redirige a la página principal
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Código de verificación inválido");
    } finally {
      setLoading(false);
    }
  };

  // Reenvía el código de verificación al correo
  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      // Notificación de que el código fue enviado
      toast({
        title: "Código enviado",
        description: "Revisa tu correo para ver el nuevo código.",
      });
    } catch (err) {
      setError(err.message || "No se pudo reenviar el código");
    }
  };

  // Inicia el registro/inicio de sesión con Google
  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  // Si ya se registró, se muestra la pantalla para ingresar el código de verificación
  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verifica tu correo"
        subtitle={`Enviamos un código a ${email}`}
      >
        {/* Muestra el error solo si existe */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        {/* Campo de 6 casillas para el código */}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {/* Botón de verificar: se desactiva si carga o si el código está incompleto */}
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar"
          )}
        </Button>
        {/* Opción para reenviar el código */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          ¿No recibiste el código?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            Reenviar
          </button>
        </p>
      </AuthLayout>
    );
  }

  // Pantalla principal: formulario de registro
  return (
    <AuthLayout
      icon={UserPlus}
      title="Crea tu cuenta"
      subtitle="Regístrate para comenzar"
      footer={
        <>
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      {/* Botón para continuar con Google */}
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continuar con Google
      </Button>

      {/* Separador visual con la palabra "o" en el centro */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">o</span>
        </div>
      </div>

      {/* Muestra el error solo si existe */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Formulario de registro */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo de correo */}
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="tu@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        {/* Campo de contraseña */}
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        {/* Campo para confirmar la contraseña */}
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        {/* Botón de crear cuenta: se desactiva mientras se procesa */}
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            "Crear cuenta"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
