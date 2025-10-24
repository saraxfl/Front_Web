import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/globals.css";
import "simple-datatables/dist/style.css";
import { AuthProvider } from "@/context/AuthContext";
import ClientBootstrap from "./ClientBootstrap";
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
/>
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
          <ClientBootstrap /> {/* habilita dropdowns, tooltips, etc. (cliente) */}
        </AuthProvider>
      </body>
    </html>
  );
}

