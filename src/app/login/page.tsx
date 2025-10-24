"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const schema = Yup.object().shape({
  email: Yup.string().email("Correo no válido").required("El correo es obligatorio"),
  password: Yup.string()
    .min(6, "La contraseña debe tener al menos 10 caracteres")
    .required("La contraseña es obligatoria"),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center bg-gray-200 px-4">
   
      <section className="w-full max-w-md rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 p-8 md:p-10">
        {}
        <div className="flex flex-col items-center text-center">
          <img
            src="https://academia.redporlaciberseguridad.org/pluginfile.php/2/course/section/1/Logo-escudo-negro.png"
            alt="Logo Red por la Ciberseguridad"
            className="w-50 h-auto mb-3 select-none drop-shadow-[0_6px_12px_rgba(0,0,0,0.25)]"
          />
     
        </div>

        {}
       <h3 className="text-center text-[10px] font-normal text-slate-600 mt-4 mb-6 tracking-wide border-0 border-t-0 border-transparent">
  Iniciar sesión
</h3>



        <Formik
          validationSchema={schema}
          validateOnChange={true}
          initialValues={{ email: "", password: "" }}
          onSubmit={async (values) => {
            setIsSigningIn(true);
            setErrorMsg(null);
            try {
              await login(values.email, values.password);
              router.replace("/dashboard");
            } catch (e: any) {
              setErrorMsg(e?.message ?? "No se pudo iniciar sesión.");
            } finally {
              setIsSigningIn(false);
            }
          }}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nombre@dominio.com"
                  value={values.email}
                  onChange={(e) => setFieldValue("email", e.target.value)}
                  className={[
                    "mt-1 w-full rounded-lg border bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none",
                    touched.email && errors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-slate-300 focus:border-[#5b6b7f] focus:ring-2 focus:ring-[#5b6b7f]/30",
                  ].join(" ")}
                />
                {touched.email && errors.email && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={(e) => setFieldValue("password", e.target.value)}
                  className={[
                    "mt-1 w-full rounded-lg border bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none",
                    touched.password && errors.password
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-slate-300 focus:border-[#5b6b7f] focus:ring-2 focus:ring-[#5b6b7f]/30",
                  ].join(" ")}
                />
                {touched.password && errors.password && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Error global */}
              {errorMsg && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                  {errorMsg}
                </p>
              )}

              {/* Botón gris-azulado */}
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full rounded-xl py-3 font-semibold text-white bg-[#62768a] shadow hover:bg-[#506070] active:translate-y-[1px] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSigningIn ? "Ingresando..." : "Ingresar"}
              </button>
            </Form>
          )}
        </Formik>
      </section>
    </main>
  );
}
