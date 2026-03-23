import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-4 py-20 pt-[calc(5.35rem+2rem)] text-center sm:pt-[calc(7rem+2rem)]"
      >
        <div className="editorial-card rounded-[1.8rem] px-8 py-10 sm:px-12">
        <p className="font-display text-6xl font-semibold text-accent">404</p>
        <h1
          className="font-display mt-4 text-xl font-semibold text-foreground"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          页面未找到
        </h1>
        <p className="mt-3 text-foreground-secondary">
          你访问的页面不存在。
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          返回首页
        </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
