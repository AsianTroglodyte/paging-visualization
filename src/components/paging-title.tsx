import { useSidebar } from "./ui/sidebar";

export function PagingTitle() {
  const { state, isMobile } = useSidebar();

  const translateX =
    !isMobile && state === "expanded"
      ? "calc(-50% + var(--sidebar-width)/2)"
      : "-50%";

  return (
    <div
      className="fixed top-0 left-1/2 z-40 flex items-center justify-center px-4 py-1 font-bold bg-black text-white rounded-b-[16px] primary-color transform-gpu transition-transform duration-200"
      style={{
        clipPath: "url(#paging-bar-clip)",
        transform: `translateX(${translateX})`,
      }}
    >
      <h1 className="text-base">Paging</h1>
    </div>
  );
}

export default PagingTitle;

