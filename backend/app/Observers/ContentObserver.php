<?php

namespace App\Observers;

use App\Services\RevalidationService;
use Illuminate\Database\Eloquent\Model;

/**
 * Invalidates the API cache and revalidates the frontend after any content save or delete.
 */
class ContentObserver
{
    public function __construct(private RevalidationService $revalidation) {}

    public function saved(Model $model): void
    {
        $this->revalidation->modelChanged($model::class);
    }

    public function deleted(Model $model): void
    {
        $this->revalidation->modelChanged($model::class);
    }
}
