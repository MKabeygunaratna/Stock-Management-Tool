import logo from "../../assets/logo.svg";

export default function SplashScreen({ label = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-white animate-fade-in">
      <img
        src={logo}
        alt="Nihon Auto Enterprises"
        className="w-64 max-w-[70vw] animate-pop sm:w-80"
      />
      <div className="flex flex-col items-center gap-3">
        <div className="h-1 w-40 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full w-1/3 animate-shimmer rounded-full bg-red-600 [background-image:linear-gradient(90deg,transparent,theme(colors.red.600),transparent)] [background-size:200px_100%]" />
        </div>
        <p className="text-sm font-medium tracking-wide text-zinc-500">{label}</p>
      </div>
    </div>
  );
}
