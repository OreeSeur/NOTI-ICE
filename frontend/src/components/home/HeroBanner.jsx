import { Link } from "react-router-dom";

import { useAuth } from "../../context/auth/useAuth";
import { getRoleHomeCopy } from "../../constants/roleExperience";

export const HeroBanner = () => {
  const { user } = useAuth();
  const copy = getRoleHomeCopy(user);

  return (
    <section
      className="
        bg-[#6f1d46]
        text-white
        rounded-2xl
        p-10
        mb-8
      "
    >
      <span className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white/90">
        {copy.eyebrow}
      </span>

      <h2 className="text-4xl font-bold mb-4">
        {copy.title}
      </h2>

      <p className="text-lg opacity-90 max-w-2xl">
        {copy.description}
      </p>

      <Link
        to={copy.ctaPath}
        className="
          inline-block
          mt-6
          bg-white
          text-[#6F1D46]
          font-semibold
          px-6
          py-3
          rounded-xl
          hover:scale-105
          transition
        "
      >
        {copy.ctaLabel}
      </Link>
    </section>
  );
};
