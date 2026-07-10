<?php

namespace App\Exceptions;

use Exception;

class InsufficientBalanceException extends Exception
{
    protected $currentBalance;
    protected $requiredAmount;

    public function __construct(float $currentBalance, float $requiredAmount, string $message = '')
    {
        $this->currentBalance = $currentBalance;
        $this->requiredAmount = $requiredAmount;

        if (empty($message)) {
            $message = "Insufficient balance. Current balance: {$currentBalance}, Required: {$requiredAmount}";
        }

        parent::__construct($message);
    }

    public function getCurrentBalance(): float
    {
        return $this->currentBalance;
    }

    public function getRequiredAmount(): float
    {
        return $this->requiredAmount;
    }
}
