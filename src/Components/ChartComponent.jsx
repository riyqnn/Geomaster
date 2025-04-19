import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function ChartComponent({ type, data, title, options = {} }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');

      // Set default options based on our dark theme
      const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: 'rgba(255, 255, 255, 0.8)',
              font: {
                family: "'Inter', sans-serif"
              }
            }
          },
          title: {
            display: !!title,
            text: title,
            color: 'rgba(255, 255, 255, 0.9)',
            font: {
              size: 16,
              family: "'Inter', sans-serif",
              weight: 'normal'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleColor: 'rgba(255, 255, 255, 0.9)',
            bodyColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            boxPadding: 5,
            titleFont: {
              family: "'Inter', sans-serif"
            },
            bodyFont: {
              family: "'Inter', sans-serif"
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              font: {
                family: "'Inter', sans-serif"
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              font: {
                family: "'Inter', sans-serif"
              }
            }
          }
        }
      };

      // Merge custom options with default options
      const mergedOptions = { ...defaultOptions, ...options };

      // Create the chart
      chartInstance.current = new Chart(ctx, {
        type: type,
        data: data,
        options: mergedOptions
      });
    }

    // Clean up chart on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [type, data, title, options]);

  return (
    <div className="h-full w-full">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

export default ChartComponent;