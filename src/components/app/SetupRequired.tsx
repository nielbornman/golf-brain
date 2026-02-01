"use client";

import Link from "next/link";
import { ui } from "@/lib/uiClasses";

export function SetupRequired() {
  return (
    <div className={ui.page}>
      <div className={ui.section}>
        <h2 className={ui.sectionTitle}>Setup required</h2>
        <p className={ui.sectionHelp}>Add your Home Club to start rounds.</p>

        <div className="mt-4 flex flex-col gap-3">
          <Link href="/account/home-club" className={ui.buttonPrimary}>
            Go to Home Club setup
          </Link>

          <div className="text-xs text-slate-600">
            Optional: add Mental Elements and Bag/BSM in Account.
          </div>
        </div>
      </div>
    </div>
  );
}
