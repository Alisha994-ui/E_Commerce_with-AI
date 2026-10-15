import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "./components/NavbarWrapper";
import Chatbot from "./components/chatbot";
import ProductDrawer from "./components/ProductDrawer";

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const body = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "ShopEase",
  description: "ShopEase — shoes, clothing, bags and electronics delivered across Pakistan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable}`}>
      <body>
        <NavbarWrapper />
        {children}
        <Chatbot />
        <ProductDrawer />
      </body>
    </html>
  );
}
