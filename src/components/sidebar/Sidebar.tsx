import FixedFeaturePanel from './FixedFeaturePanel';
import BedPanel from './BedPanel';
import SunPanel from './SunPanel';
import DesignPanel from './DesignPanel';

export default function Sidebar() {
  return (
    <div className="w-60 bg-[#1c1c1e] border-r border-white/10 flex flex-col overflow-y-auto shrink-0">
      <div className="p-3 space-y-4">
        <FixedFeaturePanel />
        <hr className="border-white/10" />
        <BedPanel />
        <hr className="border-white/10" />
        <SunPanel />
        <hr className="border-white/10" />
        <DesignPanel />
      </div>
    </div>
  );
}
