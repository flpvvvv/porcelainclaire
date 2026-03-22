import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-4 py-20"
      >
        <p className="text-6xl font-bold text-accent">404</p>
        <h1
          className="mt-4 text-xl font-semibold text-foreground"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          页面未找到
        </h1>
        <p className="mt-2 text-foreground-secondary">
          你访问的页面不存在。
        </p>
        <Link
          href="/"
          className="mt-6 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          返回首页
        </Link>
      </main>
      <Footer />
    </>
  );
}
