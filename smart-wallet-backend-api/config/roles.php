<?php

return [
    'defaults' => [
        'user' => 'customer',
    ],

    'list' => [
        'admin' => [
            'name' => 'admin',
            'label' => 'Admin',
            'description' => 'System administrator',
        ],
        'agent_manager' => [
            'name' => 'agent_manager',
            'label' => 'Agent Manager',
            'description' => 'Manages agents and approvals',
        ],
        'agent' => [
            'name' => 'agent',
            'label' => 'Agent',
            'description' => 'Agent user for wallet operations',
        ],
        'customer' => [
            'name' => 'customer',
            'label' => 'Customer',
            'description' => 'End customer user',
        ],
    ],
];
