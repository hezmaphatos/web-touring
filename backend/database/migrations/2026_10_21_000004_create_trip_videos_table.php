<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stop_id')->nullable()->constrained('trip_stops')->nullOnDelete();
            $table->integer('position')->default(0);
            $table->string('youtube_url');
            $table->string('youtube_id');
            $table->string('title')->nullable();

            $table->index(['trip_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_videos');
    }
};
