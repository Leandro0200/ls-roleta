const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27,
  13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1,
  20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

function numberColor(n) {
  if (Number(n) === 0) return "green";
  return REDS.includes(Number(n)) ? "red" : "black";
}

export default function Roulette3D() {
  return (
    <div className="real-roulette-stage">
      <div className="real-roulette-smoke one" />
      <div className="real-roulette-smoke two" />
      <div className="real-roulette-light" />

      <div className="real-roulette-perspective">
        <div className="real-roulette-wheel">
          <div className="real-metal-rim rim-outer" />
          <div className="real-metal-rim rim-inner" />

          <div className="real-pocket-ring">
            {WHEEL_NUMBERS.map((number, index) => {
              const angle = (360 / WHEEL_NUMBERS.length) * index;
              const color = numberColor(number);

              return (
                <div
                  key={`${number}-${index}`}
                  className={`real-pocket ${color}`}
                  style={{ transform: `rotate(${angle}deg) translateY(-212px)` }}
                >
                  <span style={{ transform: `rotate(${-angle}deg)` }}>
                    {number}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="real-divider-ring">
            {WHEEL_NUMBERS.map((_, index) => {
              const angle = (360 / WHEEL_NUMBERS.length) * index;
              return (
                <i
                  key={index}
                  style={{ transform: `rotate(${angle}deg) translateY(-212px)` }}
                />
              );
            })}
          </div>

          <div className="real-track">
            <div className="real-ball-orbit">
              <div className="real-white-ball" />
            </div>
          </div>

          <div className="real-bowl">
            <div className="real-bowl-lines">
              {Array.from({ length: 18 }).map((_, i) => (
                <i key={i} style={{ transform: `rotate(${i * 20}deg)` }} />
              ))}
            </div>
          </div>

          <div className="real-center">
            <div className="real-center-cap">
              <span>LS</span>
            </div>
            <div className="real-spindle" />
          </div>

          <div className="real-reflection reflection-a" />
          <div className="real-reflection reflection-b" />
          <div className="real-reflection reflection-c" />
        </div>
      </div>

      <div className="real-roulette-shadow" />
    </div>
  );
}
