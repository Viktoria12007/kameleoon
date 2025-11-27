import * as d3 from "d3";
import type ChartInterface from "../../types/ChartTypes.ts";
import { useContext, useEffect, useRef } from "react";
import { AppContext } from "../../contexts/AppContext.ts";

interface ChartProps {
    data?: ChartInterface,
    width?: number,
    height?: number,
}

const Chart = ({ data = [], width = 900, height = 400 }: ChartProps) => {
    const { appState, setAppState } = useContext(AppContext);

    const marginBottom = 30;
    const marginLeft = 40;
    const marginRight = 20;
    const marginTop = 20;
    const innerW = width - marginLeft - marginRight;
    const innerH = height - marginTop - marginBottom;

    const gx = useRef(null);
    const gy = useRef(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    let parsed: Array<{ date: Date, value: number }>;
    let x;
    let y;
    let shape;

    if (data && data.data) {
        parsed = data.data.map(d => ({
            date: new Date(d.date),
            value: conversionRate(d),
        })).sort((a, b) => a.date - b.date);

        x = d3.scaleUtc().domain([new Date("2025-01-01"), new Date("2025-12-31")]).range([marginLeft, width - marginRight]);
        y = d3.scaleLinear().domain([0, 40]).range([height - marginBottom, marginTop]);

        if (appState.lineStyle.value === 0) {
            shape = d3.line().x((d) => x(new Date(d.date))).y((d) => y(d.value));
        } else if (appState.lineStyle.value === 1) {
            shape = d3.line().x((d) => x(new Date(d.date))).y((d) => y(d.value)).curve();
        } else {
            shape = d3.area().x((d) => x(new Date(d.date))).y0(y(0)).y1((d) => y(d.value));
        }
    }

    useEffect(() => void d3.select(gx.current).call(d3.axisBottom(x).tickFormat(d3.utcFormat("%b")))
            .call(g => g.selectAll(".tick line").remove())
            .call(g => g.selectAll(".tick text").attr("fill", "#918F9A"))
            .call(g => g.selectAll(".domain").remove()),
        [gx, x]);
    useEffect(() => void d3.select(gy.current).call(d3.axisLeft(y).ticks(4).tickFormat((domainValue) => `${domainValue}%`))
            .call(g => g.selectAll(".tick line").remove())
            .call(g => g.selectAll(".tick text").attr("fill", "#918F9A"))
            .call(g => g.selectAll(".domain").remove()),
        [gy, y]);

    function conversionRate(item) {
        return (item.conversions["0"] / item.visits["0"]) * 100;
    }

    function handleMouseOver() {
        if (tooltipRef.current) {
            tooltipRef.current.style.display = 'block';
        }
    }

    function handleMouseOut() {
        if (tooltipRef.current) {
            tooltipRef.current.style.display = 'none';
        }
    }

    function handleMouseMove(event) {
        const [mx] = d3.pointer(event, this);
        const x0 = x.invert(mx);
        // find nearest point
        const bisect = d3.bisector(d => d.date).left;
        const idx = Math.min(parsed.length - 1, Math.max(0, bisect(parsed, x0)));
        const d0 = parsed[idx];
        // position focus
        // focus.attr('transform', `translate(${x(d0.date)},${y(d0.value)})`)
        if (tooltipRef.current) {
            const tt = tooltipRef.current;
            const dateStr = d3.timeFormat('%Y-%m-%d %H:%M')(d0?.date)
            tt.innerHTML = `<strong>${dateStr}</strong>`
            // position tooltip (avoid overflow)
            const parentRect = containerRef.current.getBoundingClientRect()
            const left = Math.min(parentRect.width - 160, marginLeft + x(d0?.date) + 12)
            const top = marginTop + y(d0?.value) - 12
            tt.style.left = `${left}px`
            tt.style.top = `${top}px`
        }
    }

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <svg width={width} height={height} style={{ maxWidth: '100%', height: 'auto', font: 'medium 11px Roboto sans-serif' }}>
                { parsed.length &&
                    <>
                        <rect
                            width={innerW}
                            height={innerH}
                            fill="transparent"
                            onMouseOver={handleMouseOver}
                            onMouseOut={handleMouseOut}
                            onMouseMove={handleMouseMove}
                        />
                        <g ref={gx} transform={`translate(0,${height - marginBottom})`} />
                        <g ref={gy} transform={`translate(${marginLeft},0)`} />
                        <g>
                            <g>
                                { x.ticks().map((d, i) => (<line key={i} x1={0.5 + x(d)} x2={0.5 + x(d)} y1={marginTop} y2={height - marginBottom} stroke={'#E1DFE7'} strokeDasharray={'6'} />)) }
                            </g>
                            <g>
                                { y.ticks().map((d, i) => (<line key={i} x1={marginLeft} x2={width - marginRight} y1={0.5 + y(d)} y2={0.5 + y(d)} stroke={'#E1DFE7'} />)) }
                            </g>
                        </g>
                        <g></g>
                        <path fill="none" stroke="currentColor" strokeWidth="2" d={shape(parsed)} />
                    </>
                }
                { !parsed.length && <text textAnchor="middle" fill="#918F9A">No data</text> }
            </svg>
            <div
                ref={tooltipRef}
                style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    display: 'none',
                    minWidth: 120,
                    background: 'rgba(255,255,255,0.98)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    padding: '8px 10px',
                    borderRadius: 6,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                    fontSize: 13,
                    color: '#111',
                }}
            />
        </div>
    );
}

export default Chart;
