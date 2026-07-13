"""
AI Route Optimization Service
Uses machine learning to optimize delivery routes in real-time
"""

import numpy as np
from typing import List, Dict, Tuple
from dataclasses import dataclass
from datetime import datetime
import heapq


@dataclass
class Location:
    lat: float
    lng: float


@dataclass
class Order:
    id: str
    pickup: Location
    dropoff: Location
    priority: int  # 1-5, 5 being highest
    time_window: Tuple[datetime, datetime]
    prep_time: int  # minutes


@dataclass
class Driver:
    id: str
    location: Location
    current_orders: List[str]
    capacity: int
    available: bool


class RouteOptimizer:
    """AI-powered route optimization for delivery fleet"""
    
    def __init__(self):
        self.distance_cache = {}
        
    def optimize_route(
        self,
        driver: Driver,
        orders: List[Order],
        current_time: datetime
    ) -> List[str]:
        """
        Optimize route for a driver given available orders
        Returns ordered list of order IDs
        """
        if not orders:
            return []
        
        # Filter orders that can be picked up
        feasible_orders = self._filter_feasible_orders(driver, orders, current_time)
        
        if not feasible_orders:
            return []
        
        # Use genetic algorithm for route optimization
        best_route = self._genetic_algorithm_optimization(
            driver, feasible_orders, current_time
        )
        
        return best_route
    
    def _filter_feasible_orders(
        self,
        driver: Driver,
        orders: List[Order],
        current_time: datetime
    ) -> List[Order]:
        """Filter orders that are feasible for the driver"""
        feasible = []
        
        for order in orders:
            # Check if driver has capacity
            if len(driver.current_orders) >= driver.capacity:
                continue
            
            # Check time window
            pickup_time = current_time.timestamp() + self._calculate_distance(
                driver.location, order.pickup
            ) / 60  # minutes
            
            if pickup_time > order.time_window[1].timestamp():
                continue
            
            feasible.append(order)
        
        return feasible
    
    def _genetic_algorithm_optimization(
        self,
        driver: Driver,
        orders: List[Order],
        current_time: datetime,
        population_size: int = 50,
        generations: int = 100
    ) -> List[str]:
        """Genetic algorithm for route optimization"""
        
        # Initialize population
        population = self._initialize_population(orders, population_size)
        
        for generation in range(generations):
            # Evaluate fitness
            fitness_scores = [
                self._calculate_fitness(route, driver, current_time)
                for route in population
            ]
            
            # Selection
            selected = self._selection(population, fitness_scores)
            
            # Crossover
            offspring = self._crossover(selected)
            
            # Mutation
            mutated = self._mutation(offspring)
            
            # Replace population
            population = mutated
        
        # Return best route
        fitness_scores = [
            self._calculate_fitness(route, driver, current_time)
            for route in population
        ]
        best_idx = np.argmax(fitness_scores)
        
        return [order.id for order in population[best_idx]]
    
    def _initialize_population(self, orders: List[Order], size: int) -> List[List[Order]]:
        """Initialize random population"""
        population = []
        
        for _ in range(size):
            # Random permutation of orders
            route = orders.copy()
            np.random.shuffle(route)
            population.append(route)
        
        return population
    
    def _calculate_fitness(
        self,
        route: List[Order],
        driver: Driver,
        current_time: datetime
    ) -> float:
        """Calculate fitness score for a route"""
        total_distance = 0
        total_time = 0
        current_loc = driver.location
        
        for order in route:
            # Distance to pickup
            pickup_distance = self._calculate_distance(current_loc, order.pickup)
            total_distance += pickup_distance
            total_time += pickup_distance / 60  # minutes
            
            # Distance to dropoff
            dropoff_distance = self._calculate_distance(order.pickup, order.dropoff)
            total_distance += dropoff_distance
            total_time += dropoff_distance / 60
            
            current_loc = order.dropoff
        
        # Penalty for time window violations
        time_penalty = 0
        elapsed_time = 0
        current_loc = driver.location
        
        for order in route:
            pickup_time = elapsed_time + self._calculate_distance(current_loc, order.pickup) / 60
            if pickup_time < (order.time_window[0].timestamp() - current_time.timestamp()) / 60:
                time_penalty += 10  # Early pickup penalty
            if pickup_time > (order.time_window[1].timestamp() - current_time.timestamp()) / 60:
                time_penalty += 50  # Late pickup penalty
            
            elapsed_time += self._calculate_distance(current_loc, order.pickup) / 60
            elapsed_time += self._calculate_distance(order.pickup, order.dropoff) / 60
            current_loc = order.dropoff
        
        # Priority bonus
        priority_bonus = sum(order.priority for order in route)
        
        # Fitness: maximize priority, minimize distance, time, and penalties
        fitness = (priority_bonus * 10) - total_distance - total_time - time_penalty
        
        return fitness
    
    def _selection(self, population: List[List[Order]], fitness_scores: List[float]) -> List[List[Order]]:
        """Tournament selection"""
        selected = []
        tournament_size = 5
        
        for _ in range(len(population)):
            # Random tournament
            tournament_indices = np.random.choice(len(population), tournament_size, replace=False)
            tournament_fitness = [fitness_scores[i] for i in tournament_indices]
            winner_idx = tournament_indices[np.argmax(tournament_fitness)]
            selected.append(population[winner_idx])
        
        return selected
    
    def _crossover(self, population: List[List[Order]]) -> List[List[Order]]:
        """Order crossover (OX1)"""
        offspring = []
        
        for i in range(0, len(population) - 1, 2):
            parent1 = population[i]
            parent2 = population[i + 1]
            
            # Select random crossover points
            start = np.random.randint(0, len(parent1))
            end = np.random.randint(start, len(parent1) + 1)
            
            # Create offspring
            child1 = self._order_crossover(parent1, parent2, start, end)
            child2 = self._order_crossover(parent2, parent1, start, end)
            
            offspring.extend([child1, child2])
        
        return offspring
    
    def _order_crossover(
        self,
        parent1: List[Order],
        parent2: List[Order],
        start: int,
        end: int
    ) -> List[Order]:
        """Order crossover operation"""
        child = [None] * len(parent1)
        
        # Copy segment from parent1
        child[start:end] = parent1[start:end]
        
        # Fill remaining from parent2
        parent2_remaining = [o for o in parent2 if o not in child[start:end]]
        
        child_idx = 0
        for order in parent2_remaining:
            while child[child_idx] is not None:
                child_idx += 1
            child[child_idx] = order
        
        return child
    
    def _mutation(self, population: List[List[Order]], mutation_rate: float = 0.1) -> List[List[Order]]:
        """Swap mutation"""
        mutated = []
        
        for route in population:
            if np.random.random() < mutation_rate:
                # Random swap
                i, j = np.random.choice(len(route), 2, replace=False)
                route[i], route[j] = route[j], route[i]
            
            mutated.append(route)
        
        return mutated
    
    def _calculate_distance(self, loc1: Location, loc2: Location) -> float:
        """Calculate Haversine distance between two locations"""
        cache_key = f"{loc1.lat},{loc1.lng}-{loc2.lat},{loc2.lng}"
        
        if cache_key in self.distance_cache:
            return self.distance_cache[cache_key]
        
        # Haversine formula
        R = 6371  # Earth's radius in km
        
        lat1, lng1 = np.radians(loc1.lat), np.radians(loc1.lng)
        lat2, lng2 = np.radians(loc2.lat), np.radians(loc2.lng)
        
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        
        a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlng / 2) ** 2
        c = 2 * np.arcsin(np.sqrt(a))
        
        distance = R * c
        
        self.distance_cache[cache_key] = distance
        return distance
    
    def optimize_fleet_routes(
        self,
        drivers: List[Driver],
        orders: List[Order],
        current_time: datetime
    ) -> Dict[str, List[str]]:
        """Optimize routes for entire fleet"""
        assignments = {}
        unassigned_orders = orders.copy()
        
        # Sort drivers by availability and location
        sorted_drivers = sorted(
            drivers,
            key=lambda d: (not d.available, len(d.current_orders))
        )
        
        for driver in sorted_drivers:
            if not driver.available:
                continue
            
            route = self.optimize_route(driver, unassigned_orders, current_time)
            
            if route:
                assignments[driver.id] = route
                # Remove assigned orders
                unassigned_orders = [o for o in unassigned_orders if o.id not in route]
        
        return assignments


class SurgePricingAlgorithm:
    """Dynamic surge pricing based on demand and supply"""
    
    def __init__(self):
        self.base_multiplier = 1.0
        self.max_multiplier = 3.0
        self.demand_history = []
        self.supply_history = []
    
    def calculate_surge_multiplier(
        self,
        demand: int,
        supply: int,
        time_of_day: int,
        weather_condition: str = 'clear',
        special_events: List[str] = []
    ) -> float:
        """Calculate surge multiplier based on various factors"""
        
        # Demand-supply ratio
        ratio = demand / max(supply, 1)
        
        # Base multiplier from ratio
        multiplier = 1.0 + (ratio - 1) * 0.5
        
        # Time-based adjustment
        if 17 <= time_of_day <= 19 or 12 <= time_of_day <= 13:  # Peak hours
            multiplier *= 1.3
        elif 22 <= time_of_day <= 24 or 0 <= time_of_day <= 6:  # Late night
            multiplier *= 1.5
        
        # Weather adjustment
        if weather_condition in ['rain', 'snow', 'storm']:
            multiplier *= 1.4
        elif weather_condition == 'fog':
            multiplier *= 1.2
        
        # Special events
        for event in special_events:
            if event == 'sports_event':
                multiplier *= 1.3
            elif event == 'concert':
                multiplier *= 1.4
            elif event == 'holiday':
                multiplier *= 1.5
        
        # Smooth with historical data
        if self.demand_history:
            avg_demand = np.mean(self.demand_history[-10:])
            if demand > avg_demand * 1.5:
                multiplier *= 1.2
        
        # Cap at maximum
        multiplier = min(multiplier, self.max_multiplier)
        
        # Ensure minimum of 1.0
        multiplier = max(multiplier, 1.0)
        
        # Update history
        self.demand_history.append(demand)
        self.supply_history.append(supply)
        
        # Keep only last 100 data points
        if len(self.demand_history) > 100:
            self.demand_history.pop(0)
            self.supply_history.pop(0)
        
        return round(multiplier, 2)
    
    def predict_future_demand(
        self,
        historical_data: List[int],
        forecast_horizon: int = 60
    ) -> List[int]:
        """Predict future demand using simple moving average"""
        if len(historical_data) < 10:
            return [historical_data[-1]] * forecast_horizon if historical_data else [0] * forecast_horizon
        
        # Exponential smoothing
        alpha = 0.3
        predictions = []
        last_value = historical_data[-1]
        
        for _ in range(forecast_horizon):
            # Simple trend extrapolation
            trend = (historical_data[-1] - historical_data[-10]) / 10
            predicted = last_value + trend
            predictions.append(max(0, int(predicted)))
            last_value = predicted
        
        return predictions
    
    def get_surge_areas(
        self,
        demand_by_area: Dict[str, int],
        supply_by_area: Dict[str, int]
    ) -> Dict[str, float]:
        """Get surge multipliers by area"""
        surge_areas = {}
        
        for area in demand_by_area:
            demand = demand_by_area.get(area, 0)
            supply = supply_by_area.get(area, 0)
            
            multiplier = self.calculate_surge_multiplier(
                demand, supply, datetime.now().hour
            )
            
            surge_areas[area] = multiplier
        
        return surge_areas
