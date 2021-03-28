==MONTHS\_BETWEEN(start_date, end_date)== - сколько месяцев содержиться между двумя датами. Отнимаем из start_date end_date. Функция возвращает дату.

***Примеры:***
```sql
SQL> select MONTHS_BETWEEN('12.DEC.19', '12.JAN.19') from dual;

MONTHS_BETWEEN('12.DEC.19','12.JAN.19')
---------------------------------------
                                     11

SQL> select EMPLOYEE_ID, ROUND(MONTHS_BETWEEN(END_DATE, START_DATE), 2) Sum from JOB_HISTORY;

EMPLOYEE_ID        SUM
----------- ----------
        102      66.35
        101      49.19
```
---
*tegs:* #db, #sql, #sqlFunction #date_func #single-row_func 