def advanced_flip_exchange(course):
    flip_list = []
    exchange_list = []
    num_32_count = 0
    for i in range(course.length):
        flip = 0
        exchange = 0

        is_32 = str(course.control_number[i]) == "32"
        num_32_count += is_32
        if is_32 and num_32_count == 2:
            flip = 1
        assert not flip * exchange

        flip_list.append(flip)
        exchange_list.append(exchange)

    return flip_list, exchange_list
