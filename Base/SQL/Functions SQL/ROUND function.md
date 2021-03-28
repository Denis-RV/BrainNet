==ROUND(n,`precision`)== - округление числа n до точности precision - число десятичных символов после точки, по умолчанию 0.
Если мы используем отрицательное значение в precision, идет округление символов слева от точки.

==ROUND(date, `date precision format`)== - округление дат. По умолчанию округление идет до дня. Чтобы записать второй аргмент, необходимо использовать следующий формат:
![[Pasted image 20210310182021.png]]

***Примеры***
Первый вариант round:
```sql
SQL> select ROUND(356826, -2) from dual;
 
ROUND(356826,-2)
----------------
          356800

SQL> select ROUND(356826, -1) from dual;

ROUND(356826,-1)
----------------
          356830
```

Второй вариант round:
```sql
SQL> select HIRE_DATE, round(HIRE_DATE, 'CC') from EMPLOYEES;

HIRE_DATE ROUND(HIR
--------- ---------
17-JUN-03 01-JAN-01
21-SEP-05 01-JAN-01
13-JAN-01 01-JAN-01

SQL> select HIRE_DATE, round(HIRE_DATE, 'Q') from employees;

HIRE_DATE ROUND(HIR
--------- ---------
17-JUN-03 01-JUL-03
21-SEP-05 01-OCT-05
13-JAN-01 01-JAN-01
```

---
*tegs:* #db, #sql, #sqlFunction, #single-row_func  #numeric_func #date_func  