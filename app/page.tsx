import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="pt-[72px] pb-[92px]">
        <div
          className="hero-grid mx-auto grid items-center gap-14 px-5"
          style={{ maxWidth: 1180 }}
        >
          <div className="max-w-[520px]">
            <h1
              className="mb-6 font-medium leading-[0.95] tracking-[0.01em]"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(3.3rem, 7vw, 5.6rem)",
              }}
            >
              BrailBox
            </h1>
            <p
              className="mb-[42px] max-w-[460px] leading-[1.25]"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.4rem, 2.3vw, 2rem)",
                color: "var(--text-soft)",
              }}
            >
              Create a story and translate it into the Braille code format
            </p>
            <Link
              href="#about"
              className="inline-flex items-center justify-center rounded-full px-[34px] py-4 font-semibold shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.8rem",
                minWidth: 220,
                minHeight: 68,
                background: "var(--button-bg)",
                color: "var(--button-text)",
              }}
            >
              Go for details
            </Link>
          </div>

          <div className="flex justify-center">
            <div
              className="relative flex w-full max-w-[520px] items-center justify-center overflow-hidden rounded-3xl"
              style={{
                aspectRatio: "1.15 / 0.78",
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)), rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              <Image
                src="/head.png"
                alt="BrailBox 3D render"
                width={520}
                height={352}
                className="object-contain p-6"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 text-center">
        <div className="mx-auto max-w-[900px] px-5">
          <h2
            className="mb-[34px] font-medium leading-[0.95]"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2.8rem, 5vw, 4.4rem)",
            }}
          >
            What is BrailBox
          </h2>
          <p
            className="mx-auto max-w-[860px] leading-[1.5]"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.3rem, 2vw, 1.8rem)",
              color: "var(--text-soft)",
            }}
          >
            BrailBox is an assistive device that receives written text converted into
            Braille code and displays it as tactile Braille output. It helps blind and
            visually impaired users access digital text through touch, making reading
            more accessible for students, teachers, parents, and creative learners.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="pt-[100px] pb-[110px]">
        <div className="mx-auto px-5" style={{ maxWidth: 1180 }}>
          <h2
            className="mb-[72px] text-center font-medium leading-[0.95]"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2.8rem, 5vw, 4.4rem)",
            }}
          >
            How does it work
          </h2>

          <div className="steps-grid grid gap-x-[60px] gap-y-9">
            {[
              {
                num: 1,
                title: "Write a story",
                text: "You can write any story and our software will translate this into Braille code, which could be readable by visually impaired people.",
                img: "/step-1.png",
              },
              {
                num: 2,
                title: "Plug in the BrailBox",
                text: "Connect the BrailBox device so it can receive the translated Braille output from the application.",
                img: "/step-2.png",
              },
              {
                num: 3,
                title: "Search for story",
                text: "Browse and select a story you want to read, or choose one you already created in the system.",
                img: "/step-3.png",
              },
              {
                num: 4,
                title: "Start reading",
                text: "The BrailBox presents the Braille code as tactile output, allowing users to read the text through touch.",
                img: "/step-4.png",
              },
            ].map((step) => (
              <article key={step.num} className="min-h-[250px] px-1 py-3">
                <div className="mb-5 flex items-start justify-between gap-6">
                  <h3
                    className="m-0 font-medium leading-[1.15]"
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "clamp(2rem, 3vw, 2.7rem)",
                      color: "var(--text)",
                    }}
                  >
                    {step.num}. {step.title}
                  </h3>
                  <div
                    className="flex shrink-0 items-center justify-center overflow-hidden rounded-[20px]"
                    style={{
                      width: 86,
                      height: 86,
                      background:
                        "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)), rgba(255,255,255,0.01)",
                      border: "1px solid rgba(255,255,255,0.18)",
                    }}
                  >
                    <Image
                      src={step.img}
                      alt={step.title}
                      width={72}
                      height={72}
                      className="object-contain"
                    />
                  </div>
                </div>
                <p
                  className="m-0 max-w-[430px] leading-[1.5]"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(1.2rem, 1.8vw, 1.6rem)",
                    color: "var(--text-soft)",
                  }}
                >
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pt-10 pb-[120px] text-center">
        <div className="mx-auto max-w-[900px] px-5">
          <h2
            className="mb-[34px] font-medium leading-[0.95]"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2.8rem, 5vw, 4.4rem)",
            }}
          >
            Start now
          </h2>
          <p
            className="mx-auto mb-9 max-w-[420px] leading-[1.5]"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.3rem, 2vw, 1.8rem)",
              color: "var(--text-soft)",
            }}
          >
            Write your own story
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center justify-center rounded-full px-[34px] py-4 font-semibold shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.8rem",
              minWidth: 220,
              minHeight: 68,
              background: "var(--button-bg)",
              color: "var(--button-text)",
            }}
          >
            Write a story
          </Link>
        </div>
      </section>
    </main>
  );
}
