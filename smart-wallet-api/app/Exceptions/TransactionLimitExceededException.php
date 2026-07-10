<?php

namespace App\Exceptions;

use Exception;

class TransactionLimitExceededException extends Exception
{
    protected $limitType;
    protected $limit;
    protected $used;

    public function __construct(string $limitType, float $limit, float $used, string $message = '')
    {
        $this->limitType = $limitType;
        $this->limit = $limit;
        $this->used = $used;

        if (empty($message)) {
            $message = "Transaction exceeds your {$limitType} limit. Limit: {$limit}, Used: {$used}, Remaining: " . ($limit - $used);
        }

        parent::__construct($message);
    }

    public function getLimitType(): string
    {
        return $this->limitType;
    }

    public function getLimit(): float
    {
        return $this->limit;
    }

    public function getUsed(): float
    {
        return $this->used;
    }

    public function getRemaining(): float
    {
        return $this->limit - $this->used;
    }
}
