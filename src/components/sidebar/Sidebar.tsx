import BedPanel from './BedPanel';
import MarkerPanel from './MarkerPanel';
import SunPanel from './SunPanel';
import DesignPanel from './DesignPanel';

export default function Sidebar() {
  return (
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0">
      <div className="p-3 space-y-4">
        <BedPanel />
        <hr className="border-gray-200" />
        <MarkerPanel />
        <hr className="border-gray-200" />
        <SunPanel />
        <hr className="border-gray-200" />
        <DesignPanel />
      </div>
    </div>
  );
}
