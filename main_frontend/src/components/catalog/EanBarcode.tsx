import { encodeEan13 } from '../../utils/ean13';

interface EanBarcodeProps {
  gtin: string;
  label: string;
}

const MODULE_WIDTH = 1.6;
const BAR_HEIGHT = 48;
const QUIET_ZONE = 8;

const EanBarcode = ({ gtin, label }: EanBarcodeProps) => {
  const bits = encodeEan13(gtin);
  if (!bits) {
    return <span className="font-mono text-sm font-medium tracking-wide">{gtin}</span>;
  }

  const width = bits.length * MODULE_WIDTH + QUIET_ZONE * 2;

  return (
    <figure className="inline-flex flex-col items-start gap-1">
      <svg
        role="img"
        aria-label={label}
        width={width}
        height={BAR_HEIGHT + 16}
        viewBox={`0 0 ${width} ${BAR_HEIGHT + 16}`}
        className="text-textPrimary dark:text-textPrimary-dark"
      >
        <title>{label}</title>
        <rect width={width} height={BAR_HEIGHT + 16} fill="white" />
        {bits.split('').map((bit, index) =>
          bit === '1' ? (
            <rect
              key={`${gtin}-${index}`}
              x={QUIET_ZONE + index * MODULE_WIDTH}
              y={2}
              width={MODULE_WIDTH}
              height={BAR_HEIGHT}
              fill="currentColor"
            />
          ) : null,
        )}
        <text
          x={width / 2}
          y={BAR_HEIGHT + 13}
          textAnchor="middle"
          fill="currentColor"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
        >
          {gtin}
        </text>
      </svg>
    </figure>
  );
};

export default EanBarcode;
