import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const generateHeatmapData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data: { day: string; hour: number; value: number }[] = [];
  
  for (let d = 0; d < days.length; d++) {
    for (let h = 0; h < 24; h++) {
      // Create some fake patterns (more activity during day hours 9-17)
      let baseValue = Math.random() * 20;
      if (h >= 9 && h <= 17) {
        baseValue += 40 + Math.random() * 40;
      }
      // Weekend modifier
      if (d > 4) {
        baseValue *= 0.4;
      }
      data.push({
        day: days[d],
        hour: h,
        value: Math.floor(baseValue)
      });
    }
  }
  return data;
};

export const ActivityHeatmap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const data = generateHeatmapData();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = containerRef.current.clientWidth - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Build X scales and axis:
    const x = d3.scaleBand()
      .range([0, width])
      .domain(hours.map(String))
      .padding(0.05);
      
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % 2 === 0)).tickFormat(d => `${d}h`))
      .select(".domain").remove();
      
    // Build X axis styling
    svg.selectAll(".tick text").attr("fill", "#64748b").style("font-size", "10px").style("font-family", "monospace");
    svg.selectAll(".tick line").remove();

    // Build Y scales and axis:
    const y = d3.scaleBand()
      .range([height, 0])
      .domain(days.reverse())
      .padding(0.05);
      
    svg.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove();
      
    // Build Y axis styling
    svg.selectAll(".tick text").attr("fill", "#64748b").style("font-size", "10px").style("font-family", "monospace");

    // Build color scale
    const colorScale = d3.scaleLinear<string>()
      .range(["#0f172a", "#8b5cf6", "#d946ef"])
      .domain([0, 50, 100]);

    // Create a tooltip
    const tooltip = d3.select(containerRef.current)
      .append("div")
      .style("opacity", 0)
      .attr("class", "absolute bg-slate-900 border border-slate-700 text-slate-200 p-2 rounded text-xs font-mono pointer-events-none shadow-xl z-50")
      .style("position", "absolute");

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = function(event: MouseEvent, d: any) {
      tooltip.style("opacity", 1);
      d3.select(this)
        .style("stroke", "#38bdf8")
        .style("stroke-width", 1.5)
        .style("opacity", 1);
    };
    
    const mousemove = function(event: MouseEvent, d: any) {
      const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
      tooltip
        .html(`${d.day} at ${d.hour}:00<br><span class="text-blue-400 font-bold">${d.value}</span> tasks`)
        .style("left", (mouseX + 15) + "px")
        .style("top", (mouseY - 15) + "px");
    };
    
    const mouseleave = function(event: MouseEvent, d: any) {
      tooltip.style("opacity", 0);
      d3.select(this)
        .style("stroke", "none")
        .style("opacity", 0.8);
    };

    // Add the squares
    svg.selectAll()
      .data(data, function(d: any) { return d.day + ':' + d.hour; })
      .enter()
      .append("rect")
      .attr("x", function(d) { return x(String(d.hour)) as number; })
      .attr("y", function(d) { return y(d.day) as number; })
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", x.bandwidth() )
      .attr("height", y.bandwidth() )
      .style("fill", function(d) { 
        // fallback color for empty / 0
        return d.value === 0 ? "#0f172a" : colorScale(d.value); 
      })
      .style("opacity", 0.8)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

    // Cleanup tooltip on unmount
    return () => {
      d3.select(containerRef.current).selectAll("div").remove();
    };
  }, []);

  return (
    <div className="w-full relative" ref={containerRef}>
      <svg ref={svgRef} className="w-full h-[240px]" />
    </div>
  );
};
