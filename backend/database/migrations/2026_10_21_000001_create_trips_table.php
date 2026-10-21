<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->enum('type', ['coast', 'highland', 'forest', 'city']);
            $table->enum('status', ['draft', 'published', 'planned'])->default('draft')->index();
            $table->date('started_at')->nullable();
            $table->date('ended_at')->nullable();
            $table->decimal('distance_km', 8, 1)->nullable();
            $table->integer('max_elevation_m')->nullable();
            $table->string('summary', 180)->nullable();
            $table->longText('description')->nullable();
            $table->string('pull_quote')->nullable();
            $table->string('planned_for')->nullable();
            $table->json('route_geojson')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
