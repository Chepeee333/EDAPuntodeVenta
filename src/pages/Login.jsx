import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Lock, Loader2, ShieldCheck, ShoppingCart, Eye, EyeOff, UserPlus, Mail } from "lucide-react";

const ROLES = [
  {
    key: "admin",
    label: "Administrador",
    icon: ShieldCheck,
    desc: "Acceso completo: reportes, ganancias, productos y clientes",
    color: "from-orange-500 to-orange-600",
    border: "border-orange-400",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  {
    key: "cajero",
    label: "Cajero",
    icon: ShoppingCart,
    desc: "Acceso al punto de venta",
    color: "from-emerald-500 to-emerald-600",
    border: "border-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
];

// Credenciales de cajero guardadas localmente (PIN simple)
const CAJERO_EMAIL_KEY = "pos_cajero_email";
const CAJERO_PASS_KEY = "pos_cajero_pass";

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Registro de administrador
  const [registerMode, setRegisterMode] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    if (regPassword !== regConfirm) { setRegError("Las contraseñas no coinciden"); return; }
    if (regPassword.length < 6) { setRegError("La contraseña debe tener al menos 6 caracteres"); return; }
    setRegLoading(true);
    try {
      await base44.auth.register({ email: regEmail, password: regPassword });
      setShowOtp(true);
    } catch (err) {
      setRegError(err.message || "Error al crear la cuenta");
    } finally {
      setRegLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setRegError("");
    setRegLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: regEmail, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.href = "/";
    } catch (err) {
      setRegError(err.message || "Código incorrecto");
    } finally {
      setRegLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try { await base44.auth.resendOtp(regEmail); } catch {}
  };

  // Setup cajero
  const [setupMode, setSetupMode] = useState(false);
  const [newCajeroEmail, setNewCajeroEmail] = useState("");
  const [newCajeroPass, setNewCajeroPass] = useState("");
  const [newCajeroPassConfirm, setNewCajeroPassConfirm] = useState("");
  const [setupError, setSetupError] = useState("");
  const [adminEmailForSetup, setAdminEmailForSetup] = useState("");
  const [adminPassForSetup, setAdminPassForSetup] = useState("");

  const cajeroConfigured = !!localStorage.getItem(CAJERO_EMAIL_KEY);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError("Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  const handleCajeroLogin = async (e) => {
    e.preventDefault();
    setError("");
    const savedEmail = localStorage.getItem(CAJERO_EMAIL_KEY);
    const savedPass = localStorage.getItem(CAJERO_PASS_KEY);
    if (!savedEmail || !savedPass) {
      setError("No hay cajero configurado. Pide al administrador que configure el acceso.");
      return;
    }
    if (email !== savedEmail || password !== savedPass) {
      setError("Usuario o contraseña de cajero incorrectos");
      return;
    }
    // El cajero no tiene cuenta propia en Base44, usa las credenciales del admin guardadas
    const adminEmail = localStorage.getItem("pos_admin_email");
    const adminPass = localStorage.getItem("pos_admin_pass");
    if (!adminEmail || !adminPass) {
      setError("No hay sesión de administrador disponible. Pide al admin que reconfigure el cajero.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(adminEmail, adminPass);
      localStorage.setItem("pos_role_override", "cajero");
      window.location.href = "/";
    } catch {
      setError("Error al iniciar sesión. Pide al administrador que reconfigure el acceso de cajero.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupCajero = async (e) => {
    e.preventDefault();
    setSetupError("");
    if (newCajeroPass !== newCajeroPassConfirm) {
      setSetupError("Las contraseñas no coinciden");
      return;
    }
    if (newCajeroPass.length < 4) {
      setSetupError("La contraseña debe tener al menos 4 caracteres");
      return;
    }
    setLoading(true);
    // Verificar que el admin sea válido antes de guardar
    try {
      await base44.auth.loginViaEmailPassword(adminEmailForSetup, adminPassForSetup);
      localStorage.setItem(CAJERO_EMAIL_KEY, newCajeroEmail);
      localStorage.setItem(CAJERO_PASS_KEY, newCajeroPass);
      localStorage.setItem("pos_admin_email", adminEmailForSetup);
      localStorage.setItem("pos_admin_pass", adminPassForSetup);
      base44.auth.logout();
      setSetupMode(false);
      setSelectedRole("cajero");
      setEmail(newCajeroEmail);
      setPassword("");
    } catch {
      setSetupError("Credenciales de administrador incorrectas");
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de selección de rol
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🍽️</div>
            <h1 className="text-3xl font-heading font-bold text-white">POS System</h1>
            <p className="text-slate-400 mt-2">¿Cómo deseas ingresar?</p>
          </div>
          <div className="space-y-4">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.key}
                  onClick={() => { setSelectedRole(role.key); setError(""); setEmail(""); setPassword(""); }}
                  className={`w-full p-5 rounded-2xl border-2 ${role.border} ${role.bg} flex items-center gap-4 hover:shadow-lg transition-all group`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className={`font-semibold text-lg ${role.text}`}>{role.label}</div>
                    <div className="text-sm text-slate-500">{role.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentRole = ROLES.find(r => r.key === selectedRole);
  const Icon = currentRole.icon;

  // Pantalla de configuración de cajero
  if (setupMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
          <button onClick={() => setSetupMode(false)} className="text-sm text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1">← Volver</button>
          <h2 className="text-2xl font-heading font-bold text-slate-800 mb-1">Configurar Cajero</h2>
          <p className="text-sm text-slate-500 mb-6">Ingresa tus credenciales de administrador para autorizar la creación del acceso de cajero.</p>

          {setupError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{setupError}</div>
          )}

          <form onSubmit={handleSetupCajero} className="space-y-4">
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-3">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Verificación de Administrador</p>
              <div className="space-y-1">
                <Label className="text-sm">Correo del Administrador</Label>
                <Input value={adminEmailForSetup} onChange={e => setAdminEmailForSetup(e.target.value)} type="email" placeholder="admin@ejemplo.com" required />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Contraseña del Administrador</Label>
                <Input value={adminPassForSetup} onChange={e => setAdminPassForSetup(e.target.value)} type="password" placeholder="••••••••" required />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Nuevo Acceso de Cajero</p>
              <div className="space-y-1">
                <Label className="text-sm">Usuario (correo del cajero)</Label>
                <Input value={newCajeroEmail} onChange={e => setNewCajeroEmail(e.target.value)} type="email" placeholder="cajero@ejemplo.com" required />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Contraseña</Label>
                <Input value={newCajeroPass} onChange={e => setNewCajeroPass(e.target.value)} type="password" placeholder="Mínimo 4 caracteres" required />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Confirmar contraseña</Label>
                <Input value={newCajeroPassConfirm} onChange={e => setNewCajeroPassConfirm(e.target.value)} type="password" placeholder="Repite la contraseña" required />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Guardar Acceso de Cajero
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Registro de administrador — verificación OTP
  if (selectedRole === "admin" && registerMode && showOtp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-slate-800 mb-1">Verifica tu correo</h2>
          <p className="text-sm text-slate-500 mb-6">Enviamos un código a <strong>{regEmail}</strong></p>

          {regError && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{regError}</div>}

          <div className="flex justify-center mb-6">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus>
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

          <Button className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white" onClick={handleVerifyOtp} disabled={regLoading || otpCode.length < 6}>
            {regLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Verificar y entrar
          </Button>
          <p className="text-center text-sm text-slate-400 mt-4">
            ¿No recibiste el código?{" "}
            <button onClick={handleResendOtp} className="text-orange-500 font-medium hover:underline">Reenviar</button>
          </p>
        </div>
      </div>
    );
  }

  // Registro de administrador — formulario
  if (selectedRole === "admin" && registerMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
          <button onClick={() => setRegisterMode(false)} className="text-sm text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1">← Volver al login</button>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-slate-800 mb-1">Crear cuenta de Administrador</h2>
          <p className="text-sm text-slate-500 mb-6">Registra el correo y contraseña para el acceso de administrador.</p>

          {regError && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{regError}</div>}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input type="email" placeholder="admin@ejemplo.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="h-12" required />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="h-12" required />
            </div>
            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <Input type="password" placeholder="Repite la contraseña" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} className="h-12" required />
            </div>
            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 border-0 text-white hover:opacity-90" disabled={regLoading}>
              {regLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Crear cuenta
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Formulario de login
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <button onClick={() => setSelectedRole(null)} className="text-sm text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1">← Cambiar rol</button>

        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentRole.color} flex items-center justify-center mb-4`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-slate-800 mb-1">
          Iniciar como {currentRole.label}
        </h2>
        <p className="text-sm text-slate-500 mb-6">{currentRole.desc}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={selectedRole === "admin" ? handleAdminLogin : handleCajeroLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pr-10"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className={`w-full h-12 font-medium bg-gradient-to-r ${currentRole.color} border-0 text-white hover:opacity-90`} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
            Ingresar
          </Button>
        </form>

        {selectedRole === "admin" && (
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">
              ¿No tienes cuenta de administrador?{" "}
              <button onClick={() => { setRegisterMode(true); setRegError(""); setRegEmail(""); setRegPassword(""); setRegConfirm(""); setShowOtp(false); setOtpCode(""); }} className="text-orange-500 font-medium hover:underline">
                Crear cuenta
              </button>
            </p>
          </div>
        )}

        {selectedRole === "cajero" && !cajeroConfigured && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
            No hay cajero configurado.{" "}
            <button onClick={() => setSetupMode(true)} className="font-semibold underline hover:no-underline">Configurar ahora</button>
          </div>
        )}

        {selectedRole === "cajero" && cajeroConfigured && (
          <div className="mt-4 text-center">
            <button onClick={() => setSetupMode(true)} className="text-xs text-slate-400 hover:text-slate-600 underline">
              ¿Cambiar credenciales de cajero?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}