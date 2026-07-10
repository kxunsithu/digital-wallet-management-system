<?php

namespace App\Providers;

use App\Events\KycApprovedEvent;
use App\Events\TransactionCompletedEvent;
use App\Listeners\LogTransactionListener;
use App\Listeners\UpgradeCustomerLevelListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        KycApprovedEvent::class => [
            UpgradeCustomerLevelListener::class,
        ],
        TransactionCompletedEvent::class => [
            LogTransactionListener::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }
}
