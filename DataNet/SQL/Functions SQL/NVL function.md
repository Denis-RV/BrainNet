==NVL(value, ifnull)== - Если значение раво null, возвращает ifnull, иначе само возвращает значение. Оба параметра должны быть одинаковыми типами данных.

***Примеры:***
```sql
select NVL(28, 49) from dual; \--Out: 28  
select NVL(null, 35) from dual; \--Out: 35
select FIRST\_NAME, NVL(COMMISSION\_PCT, 0) from EMPLOYEES;
```
---
*tegs:* #database, #sql, #sqlFunction #general_func #single-row_func 