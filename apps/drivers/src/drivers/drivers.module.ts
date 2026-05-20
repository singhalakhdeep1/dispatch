import { Module } from "@nestjs/common";
import { DriversController } from "./drivers.controller";
import { DriversService } from "./drivers.service";
import { LocationService } from "../location/location.service";
import { OrderConsumer } from "../kafka/kafka.consumer";

@Module({
    controllers: [DriversController],
    providers: [DriversService, LocationService, OrderConsumer],
    exports: [DriversService, LocationService],
})
export class DriversModule {}
