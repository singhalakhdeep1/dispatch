// Prophet forecasting service for dispatch

class ProphetService {
  async forecastDemand(data: { ds: string; y: number }[], periods: number = 30) {
    // Simplified forecasting - in production would use actual Prophet library
    const values = data.map((d) => d.y);
    const lastValue = values[values.length - 1];
    const trend = (values[values.length - 1] - values[0]) / values.length;

    const forecast = [];
    for (let i = 1; i <= periods; i++) {
      forecast.push({
        ds: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        yhat: lastValue + trend * i,
        yhat_lower: lastValue + trend * i - 10,
        yhat_upper: lastValue + trend * i + 10,
      });
    }

    return forecast;
  }

  async forecastDeliveryTime(data: { ds: string; y: number }[], periods: number = 7) {
    const values = data.map((d) => d.y);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    const forecast = [];
    for (let i = 1; i <= periods; i++) {
      forecast.push({
        ds: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        yhat: avg,
        yhat_lower: avg - 5,
        yhat_upper: avg + 5,
      });
    }

    return forecast;
  }
}

export const prophetService = new ProphetService();
