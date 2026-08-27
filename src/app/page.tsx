import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import LicensingGravity from "@/components/LicensingGravity";
import WindowsPremium from "@/components/WindowsPremium";
import ForkInTheRoad from "@/components/ForkInTheRoad";
import CostModeling from "@/components/CostModeling";
import WhatIsWine from "@/components/WhatIsWine";
import ProofAndValidation from "@/components/ProofAndValidation";
import EngagementModel from "@/components/EngagementModel";
import EnterpriseSupport from "@/components/EnterpriseSupport";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        {/* Continuous cycling gradient: green → dark → blue → dark, repeating */}
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-y-0 inset-x-0"
            style={{
              background: `linear-gradient(to bottom,
                rgba(94,234,212,0.05) 0%,
                rgba(94,234,212,0.025) 5%,
                transparent 10%,
                rgba(59,130,246,0.04) 15%,
                rgba(59,130,246,0.06) 20%,
                transparent 25%,
                rgba(94,234,212,0.035) 30%,
                rgba(94,234,212,0.05) 35%,
                transparent 40%,
                rgba(59,130,246,0.04) 45%,
                rgba(59,130,246,0.06) 50%,
                transparent 55%,
                rgba(94,234,212,0.035) 60%,
                rgba(94,234,212,0.05) 65%,
                transparent 70%,
                rgba(59,130,246,0.04) 75%,
                rgba(59,130,246,0.06) 80%,
                transparent 85%,
                rgba(94,234,212,0.035) 90%,
                rgba(94,234,212,0.05) 95%,
                transparent 100%
              )`,
            }}
          />
          <LicensingGravity />
          <ForkInTheRoad />
          <WindowsPremium />
          <CostModeling />
          <WhatIsWine />
        </div>
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-y-0 inset-x-0"
            style={{
              background: `linear-gradient(to bottom,
                rgba(59,130,246,0.04) 0%,
                rgba(59,130,246,0.06) 8%,
                transparent 16%,
                rgba(94,234,212,0.035) 24%,
                rgba(94,234,212,0.05) 32%,
                transparent 40%,
                rgba(59,130,246,0.04) 48%,
                rgba(59,130,246,0.06) 56%,
                transparent 64%,
                rgba(94,234,212,0.035) 72%,
                rgba(94,234,212,0.05) 80%,
                transparent 88%,
                rgba(59,130,246,0.035) 94%,
                transparent 100%
              )`,
            }}
          />
          <ProofAndValidation />
          <EngagementModel />
          <EnterpriseSupport />
          <FAQ />
          <FinalCTA />
        </div>
      </main>
      <Footer />
    </>
  );
}
